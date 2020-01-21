const grpc = require('grpc');
const Log = require('./log');
const Timer = require('./timer');
const State = require('./state');
const services = require('./services');
const Follower = require('./follower');
const RPCController = require('./utils').RPCController;

class Node {
  static modes = {
    follower: 'FOLLOWER',
    candidate: 'CANDIDATE',
    leader: 'LEADER',
  };

  #id;
  #server;
  #address;
  #followers;
  #electionTimer;
  #heartbeatTimer;
  #applyLogsTimer;
  #connectionTimer;
  #logs = [];
  #votedFor = null;
  #leaderId = null;
  #currentTerm = 0;
  #commitIndex = -1;
  #lastApplied = -1;
  #mode = Node.modes.follower;
  #state = new State((...args) => this.#debug(...args));

  constructor({ id, address, followers }) {
    this.#id = id;
    this.#address = address;
    this.#followers = followers.map(
      follower => new Follower({ address: follower.address, lastLogIndex: this.#logs.length - 1 }),
    );

    const server = new grpc.Server();
    server.addService(services.Follower.service, {
      requestVote: this.#vote,
      appendEntries: this.#appendEntries,
    });
    server.addService(services.Client.service, {
      kill: (_, done) => {
        done(null, {});

        process.exit(0);
      },
      requestStatus: RPCController(() => this.status),
      set: this.#setValue,
      get: this.#getValue,
      remove: this.#removeValue,
    });
    this.#server = server;

    const getTimerCallbacks = name => ({
      onSart: ({ runs }) => this.#debug(`${name} timer start. Run: ${runs}`),
      onReset: ({ runs }) => this.#debug(`${name} timer reset. Run: ${runs}`),
      onStop: ({ runs }) => this.#debug(`${name} timer stop. Run: ${runs}`),
      onOver: ({ runs }) => this.#debug(`${name} timer over. Run: ${runs}`),
    });

    this.#connectionTimer = new Timer(
      () => 200 + Math.random() * 200,
      this.#switchToCandidateMode,
      getTimerCallbacks('connetion'),
    );
    this.#electionTimer = new Timer(
      () => Math.max(150 + this.#electionTimer.runs * (1 + Math.random() * 10), 2000),
      this.#contestElection,
      getTimerCallbacks('election'),
    );
    this.#heartbeatTimer = new Timer(50, this.#sendHeartbeat, getTimerCallbacks('heartbeat'));
    this.#applyLogsTimer = new Timer(50, this.#applyLogs, getTimerCallbacks('apply logs'));
  }

  listen = () => {
    this.#server.bind(this.#address, grpc.ServerCredentials.createInsecure());
    this.#server.start();
  };

  start = () => {
    this.#applyLogsTimer.start();
    this.#switchToFollowerMode();
  };

  get status() {
    return {
      term: this.#currentTerm,
      id: this.#id,
      mode: this.#mode,
      commitIndex: this.#commitIndex,
      lastApplied: this.#lastApplied,
      lastLogIndex: this.#logs.length - 1,
      address: this.#address,
      votedFor: this.#votedFor,
    };
  }

  isFollower = () => this.#mode === Node.modes.follower;

  isCandidate = () => this.#mode === Node.modes.candidate;

  isLeader = () => this.#mode === Node.modes.leader;

  /* Procedures Start*/
  /* Follower Procedure Start */
  #switchToFollowerMode = () => {
    this.#debug('switched to follower mode');
    this.#electionTimer.stop();
    this.#heartbeatTimer.stop();

    this.#runFollowerProcedure();
  };

  #runFollowerProcedure = () => {
    this.#mode = Node.modes.follower;
    this.#connectionTimer.start();
  };
  /* Follower Procedure End */

  /* Candidate Procedure Start */
  #switchToCandidateMode = () => {
    if (!this.#connectionTimer.running) return;

    this.#debug('switched to candidate mode');
    this.#connectionTimer.stop();

    this.#runCandidateProcedure();
  };

  #runCandidateProcedure = () => {
    this.#mode = Node.modes.candidate;
    this.#electionTimer.startNow();
  };

  #contestElection = async () => {
    const timeStart = new Date();
    if (this.#electionTimer.runs > 1) this.#currentTerm++;
    this.#votedFor = this.#id;

    let votesGranted = 1;
    const request = this.#getRequestVotePayload();
    const run = this.#electionTimer.runs;

    const votes = await Promise.all(
      this.#followers.map(async (follower, index) => {
        try {
          const vote = await follower.requestVote(request);
          this.#debug(`Vote Received: ${index + 1}`, request, vote);
          const stale = this.#checkStaleVote(request, run);

          if (!stale && vote.term > this.#currentTerm) {
            this.#currentTerm = vote.term;
            this.#votedFor = null;
            this.#switchToFollowerMode();

            return vote;
          }

          if (vote.voteGranted) {
            votesGranted++;
          }

          if (!stale && votesGranted > (this.#followers.length + 1) / 2) {
            this.#debug(`Follower ${index + 1} completed majority`);
            this.#switchToLeaderMode();
          }

          return vote;
        } catch (err) {
          console.log(err);
          return { term: -1, voteGranted: false };
        }
      }),
    );

    this.#debug(`Run: ${run} Election Time: ${new Date() - timeStart}`, votes);
    return votes;
  };

  #getRequestVotePayload = () => ({
    term: this.#currentTerm,
    candidateId: this.#id,
    lastLogIndex: this.#logs.length - 1,
    lastLogTerm: (this.#logs[this.#logs.length - 1] || new Log()).term,
  });

  #checkStaleVote = (request, run) => {
    if (!this.isCandidate()) return true;
    if (run !== this.#electionTimer.runs) return true;

    const latestRecord = this.#getRequestVotePayload();
    return ['term', 'lastLogIndex', 'lastLogTerm'].reduce((stale, key) => {
      if (stale) return stale;

      return latestRecord[key] !== request[key];
    }, false);
  };
  /* Candidate Procedure End */

  /* Leader Procedure Start */
  #switchToLeaderMode = () => {
    this.#debug('switched to leader mode');
    this.#leaderId = this.#id;
    this.#electionTimer.stop();

    this.#runLeaderProcedure();
  };

  #runLeaderProcedure = () => {
    this.#mode = Node.modes.leader;
    this.#heartbeatTimer.startNow();
  };

  #sendHeartbeat = () => {
    const run = this.#heartbeatTimer.runs;

    return new Promise(resolve => {
      const results = [];

      const updateProgress = response => {
        results.push(response);

        const successes = results.filter(result => result.success).length + 1;
        const failures = results.length - successes + 1;
        const required = (this.#followers.length + 1) / 2;

        if (successes > required) {
          resolve({ results, accepted: true });
        } else if (failures > required) {
          resolve({ results, accepted: false });
        }
      };

      this.#followers.forEach(async (follower, index) => {
        const request = this.#getAppendEntriesPayload(follower);
        const response = await follower.appendEntries(request);
        const debug = () =>
          this.#debug(
            `Send Heartbeat Run: ${run} Follower: ${index + 1}/${this.#followers.length}`,
            request,
            follower.details,
            response,
          );

        if (this.#checkStaleHeartbeat(follower, request, run)) {
          debug();
          return updateProgress(response);
        }

        if (response.success) {
          follower.nextIndex += request.entries.length;
          follower.matchIndex = follower.nextIndex - 1;

          const matchIndexCounts = {};

          this.#followers.forEach(_follower => {
            if (!matchIndexCounts[_follower.matchIndex]) {
              matchIndexCounts[_follower.matchIndex] = 0;
            }

            matchIndexCounts[_follower.matchIndex]++;
          });

          const result = Object.keys(matchIndexCounts).reduce(
            (result, key) => {
              const matchIndex = Number(key);
              const count = matchIndexCounts[key];
              if (count > result.count || (count === result.count && matchIndex > result.matchIndex)) {
                return { matchIndex, count };
              }

              return result;
            },
            { matchIndex: -1, count: 0 },
          );

          if (result.count >= this.#followers.length / 2) {
            for (let logIndex = result.matchIndex; logIndex > this.#commitIndex; logIndex--) {
              if ((this.#logs[logIndex] || new Log()).term === this.#currentTerm) {
                this.#commitIndex = logIndex;
                break;
              }
            }
          }

          updateProgress(response);
        } else if (response.term > this.#currentTerm) {
          updateProgress(response);
          this.#switchToFollowerMode();
        } else {
          updateProgress(response);
          follower.decreaseNextIndex();
        }

        debug();
      });
    });
  };

  #getAppendEntriesPayload = follower => ({
    term: this.#currentTerm,
    leaderId: this.#id,
    prevLogIndex: follower.nextIndex - 1,
    prevLogTerm: (this.#logs[follower.nextIndex - 1] || new Log()).term,
    entries: this.#logs.slice(follower.nextIndex, this.#logs.length),
    leaderCommit: this.#commitIndex,
  });

  #checkStaleHeartbeat = (follower, request, run) => {
    if (!this.isLeader()) return false;
    if (run !== this.#heartbeatTimer.runs) return false;

    const latestRecord = this.#getAppendEntriesPayload(follower);
    return ['term', 'prevLogIndex', 'prevLogTerm'].reduce((stale, key) => {
      if (stale) return stale;

      return latestRecord[key] !== request[key];
    }, false);
  };
  /* Leader Procedure End */
  /* Procedures End*/

  /* Follower Service controllers Start*/
  /* RequestVote Controller Start*/
  #vote = RPCController(
    request => {
      if (request.term < this.#currentTerm) return this.#getVoteResponse(request, false);

      const lastLog = this.#logs[this.#logs.length - 1] || new Log();
      if (lastLog.term > request.lastLogTerm || this.#logs.length - 1 > request.lastLogIndex)
        return this.#getVoteResponse(request, false);

      if (
        (request.term > this.#currentTerm && this.#logs.length - 1 <= request.lastLogIndex) ||
        (request.term === this.#currentTerm && this.isFollower() && this.#votedFor === null)
      ) {
        if (!this.isFollower() && request.term > this.#currentTerm) {
          this.#debug('granting vote to newer candidate', this.isFollower(), request.term > this.#currentTerm);
          const vote = this.#grantVote(request);
          this.#switchToFollowerMode();

          return vote;
        }

        return this.#grantVote(request);
      }

      return this.#getVoteResponse(request, false);
    },
    {
      transform: request => ({
        ...request,
        term: Number(request.term),
        lastLogIndex: Number(request.lastLogIndex),
        lastLogTerm: Number(request.lastLogTerm),
      }),
    },
  );

  #grantVote = request => {
    this.#connectionTimer.reset();

    return this.#getVoteResponse(request, true);
  };

  #getVoteResponse = (request, voteGranted) => {
    const response = { term: this.#currentTerm, voteGranted };
    this.#debug('Vote Request', request, response);

    return response;
  };
  /* RequestVote Controller End*/

  /* AppendEntries Controller Start*/
  #appendEntries = RPCController(
    request => {
      const debug = response => {
        this.#debug('Append Entries', request, response, this.status);
        return response;
      };

      if (request.term < this.#currentTerm) return debug(this.#getAppendEntriesResponse(false));

      /*
      if (request.term == this.#currentTerm && this.#votedFor != request.leaderId)
        return debug(this.#getAppendEntriesResponse(false));
        */
      if ((this.#logs[request.prevLogIndex] || new Log()).term !== request.prevLogTerm)
        return debug(this.#getAppendEntriesResponse(false));

      if (!this.isFollower()) {
        if (request.term > this.#currentTerm || (request.leaderCommit > this.#commitIndex && this.isCandidate())) {
          const response = debug(this.#acceptEntries(request));
          this.#switchToFollowerMode();

          return response;
        } else return debug(this.#getAppendEntriesResponse(false));
      }

      return debug(this.#acceptEntries(request));
    },
    {
      transform: request => ({
        ...request,
        term: Number(request.term),
        prevLogIndex: Number(request.prevLogIndex),
        prevLogTerm: Number(request.prevLogTerm),
        leaderCommit: Number(request.leaderCommit),
        entries: request.entries || [],
      }),
    },
  );

  #acceptEntries = request => {
    if (this.isFollower() || request.term > this.#currentTerm) {
      this.#votedFor = request.leaderId;
      this.#leaderId = request.leaderId;
    }
    this.#currentTerm = request.term;
    this.#connectionTimer.reset();

    const logs = request.entries.sort((l, r) => (l.position > r.position ? 1 : -1)).map(entery => new Log(entery));
    logs.forEach(log => {
      const logAtPos = this.#logs[log.position];
      if (logAtPos && logAtPos.term !== log.term) {
        this.#logs = this.#logs.slice(log.position);
        this.#logs.pop();
      }

      this.#logs[log.position] = log;
    });

    if (request.leaderCommit > this.#commitIndex)
      this.#commitIndex = Math.min(request.leaderCommit, this.#logs.length - 1);

    return this.#getAppendEntriesResponse(true);
  };

  #getAppendEntriesResponse = success => ({ term: this.#currentTerm, success });
  /* AppendEntries Controller End*/
  /* Follower Service controllers End*/

  /* Client Service controllers Start*/
  /* Set Controller Start*/
  #setValue = RPCController(request => {
    const log = new Log({
      key: request.key,
      value: request.value,
      term: this.#currentTerm,
      position: this.#logs.length,
      action: 'SET',
    });

    return this.#setLog(request, log);
  });
  /* Set Controller End*/

  /* Get Controller Start*/
  #getValue = RPCController(request => {
    if (!this.isLeader()) {
      const response = this.#getStateValueResponse(undefined, false);
      this.#debug('GET Value', request, response);

      return response;
    }

    const value = this.#state.get(request.key);

    return this.#getStateValueResponse(value, true);
  });
  /* Get Controller End*/

  /* Remove Controller Start*/
  #removeValue = RPCController(async request => {
    const log = new Log({
      key: request.key,
      term: this.#currentTerm,
      position: this.#logs.length,
      action: 'REMOVE',
    });

    return this.#setLog(request, log);
  });

  #setLog = async (request, log) => {
    if (!this.isLeader()) {
      const response = this.#getSuccessValueResponse(false);
      this.#debug(`${log.action} Value`, request, response);

      return response;
    }

    this.#logs.push(log);
    const { results, accepted } = await this.#heartbeatTimer.performNow();

    const debug = response => {
      this.#debug(`${log.action} Value`, request, response, {
        accepted,
        results,
        position: log.position,
        commitIndex: this.#commitIndex,
      });

      return response;
    };

    if (accepted && this.#commitIndex >= log.position) {
      this.#applyLogsTimer.performNow();

      return debug(this.#getSuccessValueResponse(this.#lastApplied >= log.position));
    }

    return debug(this.#getSuccessValueResponse(false));
  };
  /* Remove Controller End*/

  /* Utils Start */
  #getStateValueResponse = (value, success) => ({
    value,
    success,
    leaderId: this.#leaderId,
  });

  #getSuccessValueResponse = success => ({
    success,
    leaderId: this.#leaderId,
  });

  #applyLogs = () => {
    for (let index = this.#lastApplied + 1; index <= this.#commitIndex; index++) {
      this.#state.apply(this.#logs[index]);
      this.#lastApplied++;
    }
  };
  /* Utils End */
  /* Client Service controllers End*/

  /* Utils Start */
  #debug = (...logs) => {
    if (logs.length > 1) {
      console.log(`Node: ${this.#id} Term: ${this.#currentTerm} Mode: ${this.#mode}`);
      logs.forEach(log => console.log(log));
      console.log('\n\n');
    } else {
      console.log(`Node ${this.#id}: ${logs[0]}\n\n`);
    }
  };
  /* Utils End */
}

module.exports = Node;
