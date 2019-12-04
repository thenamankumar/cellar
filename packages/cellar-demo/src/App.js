import React from 'react';
import Node from './components/Node';
import {Spinner} from 'reactstrap';
import NavBar from './components/NavBar';
import Controls from './components/Controls/';
import fetchStatus from './actions/fetchStatus';
import './App.css';

class App extends React.Component {
  state = {nodes: []};

  componentDidMount() {
    this.ping = setInterval(async () => {
      this.setState({nodes: await fetchStatus()});
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.ping);
  }

  render() {
    const {nodes} = this.state;

    return (
      <div className="App">
        <NavBar />
        <div className="container">
          <div className="row">
            {nodes.length ? (
              <React.Fragment>
                <Controls />
                {nodes.map(node => (
                  <Node key={node.id} node={node} />
                ))}
              </React.Fragment>
            ) : (
              <Spinner />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
