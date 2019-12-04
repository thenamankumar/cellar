import React from 'react';
import {Card, Button} from 'reactstrap';
import killNode from '../../actions/killNode';
import './index.css';

class Node extends React.PureComponent {
  render() {
    const {node} = this.props;
    let color = 'warning';
    if (node.mode === 'CANDIDATE') color = 'info';
    if (node.mode === 'LEADER') color = 'success';
    if (node.down) color = 'danger';

    return (
      <div className="NodeBox col-md-4">
        <Card className="NodeContent" outline color={color}>
          <h3 className="text-center">{node.id}</h3>
          <p className="text-center text-primary italic">{node.address}</p>
          <h2 className="text-center">{node.mode || 'DOWN'}</h2>
          <div className="NodeDetails">
            {[
              'term',
              'commitIndex',
              'lastApplied',
              'lastLogIndex',
              'votedFor',
            ].map(key => (
              <div className="row" key={key}>
                <div className="col-6 bold NodeDetailPoint">{key}</div>
                <div className="col-6 text-right">{node[key]}</div>
              </div>
            ))}
          </div>
          <div className="NodeActions text-center mt-3">
            {!node.down && (
              <Button color="danger" onClick={() => killNode({id: node.id})}>
                Stop
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }
}

export default Node;
