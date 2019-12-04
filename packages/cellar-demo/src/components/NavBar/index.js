import React from 'react';
import {Navbar, NavbarBrand} from 'reactstrap';

class NavBar extends React.PureComponent {
  render() {
    return (
      <Navbar color="dark" dark expand="md" className="mb-5">
        <NavbarBrand href="/">Cellar</NavbarBrand>
      </Navbar>
    );
  }
}

export default NavBar;
