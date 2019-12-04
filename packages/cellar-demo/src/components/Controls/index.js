import React from 'react';
import getValueCall from '../../actions/getValue';
import setValueCall from '../../actions/setValue';
import removeValueCall from '../../actions/removeValue';
import {Card, Form, Input, Button} from 'reactstrap';

class Controls extends React.PureComponent {
  state = {
    getKey: '',
    getValue: '',
    setKey: '',
    setValue: '',
    setSuccess: false,
    removeKey: '',
    removeValue: '',
    removeSuccess: false,
  };

  get = async () => {
    const {getKey} = this.state;

    const value = await getValueCall({key: getKey});

    this.setState({getValue: value || 'Not Found'});
  };

  set = async () => {
    const {setKey, setValue} = this.state;

    const result = await setValueCall({key: setKey, value: setValue});

    this.setState({setSuccess: result.success});
  };

  remove = async () => {
    const {removeKey} = this.state;

    const result = await removeValueCall({key: removeKey});

    this.setState({removeSuccess: result.success});
  };

  render() {
    const {
      getKey,
      getValue,
      setKey,
      setValue,
      setSuccess,
      removeKey,
      removeSuccess,
    } = this.state;

    return (
      <React.Fragment>
        <div className="NodeBox col-md-4">
          <Card className="NodeContent" outline color={'default'}>
            <Form>
              <h4>Get</h4>
              <Input
                name="key"
                type="text"
                placeholder="key"
                value={getKey}
                onChange={e =>
                  this.setState({getKey: e.target.value, getValue: ''})
                }
              />
              <Input
                className="mt-2"
                name="value"
                type="text"
                placeholder="value"
                value={getValue}
                disabled={true}
              />
              <div className="text-right">
                <Button className="mt-2" size="small" onClick={this.get}>
                  Go
                </Button>
              </div>
            </Form>
          </Card>
        </div>
        <div className="NodeBox col-md-4">
          <Card className="NodeContent" outline color={'default'}>
            <Form>
              <h4>Set</h4>
              <Input
                value={setKey}
                onChange={e =>
                  this.setState({setKey: e.target.value, setSuccess: false})
                }
                name="key"
                type="text"
                placeholder="key"
              />
              <Input
                className="mt-2"
                name="value"
                value={setValue}
                type="text"
                placeholder="value"
                onChange={e =>
                  this.setState({setValue: e.target.value, setSuccess: false})
                }
              />
              <div className="text-right">
                <Button className="mt-2" size="small" onClick={this.set}>
                  Go
                </Button>
              </div>
              {setSuccess && <h4 className="text-success">Success</h4>}
            </Form>
          </Card>
        </div>
        <div className="NodeBox col-md-4">
          <Card className="NodeContent" outline color={'default'}>
            <Form>
              <h4>Remove</h4>
              <Input
                value={removeKey}
                onChange={e =>
                  this.setState({
                    removeKey: e.target.value,
                    removeSuccess: false,
                  })
                }
                name="key"
                type="text"
                placeholder="key"
              />
              <div className="text-right">
                <Button className="mt-2" size="small" onClick={this.remove}>
                  Go
                </Button>
              </div>
              {removeSuccess && <h4 className="text-success">Success</h4>}
            </Form>
          </Card>
        </div>
      </React.Fragment>
    );
  }
}

export default Controls;
