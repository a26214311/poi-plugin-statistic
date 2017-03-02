import React, {Component} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'

import {store} from 'views/create-store'

import {join} from 'path'
import {FormGroup, FormControl, ListGroup, ListGroupItem, Button, Row, Col, Table} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'


import {extensionSelectorFactory} from 'views/utils/selectors'
const fs = require('fs')
const http = require('http')
export const reactClass = connect(
  state => ({
    horizontal: state.config.poi.layout || 'horizontal',
    $ships: state.const.$ships,
    $shipTypes: state.const.$shipTypes
  }),
  null, null, {pure: false}
)(class PluginStatistic extends Component {

  constructor(props) {
    super(props)
    this.state = {
      ship_targets: this.simplfyship(),
      show_shipList: false,
      input_shipList: '',
      detail:{}
    }
  }

  componentWillReceiveProps(nextProps) {
  }

  handleFormChange(e) {
    let value = e.currentTarget.value;
    this.get_statistic_info(value);
  }

  simplfyship() {
    try {
      return this.simplfyship_D();
    } catch (e) {
      console.log(e);
      try {
        return Object.keys(this.props.$ships);
      } catch (e2) {
        console.log(e2);
        return [];
      }
    }

  }

  simplfyship_D() {
    let $ships = this.props.$ships;
    for (let p in $ships) {
      let ship = $ships[p];
      let afterlv = ship.api_afterlv;
      let aftershipid = ship.api_aftershipid;
      if (afterlv && aftershipid) {
        let aftership = $ships[aftershipid];
        let aftership_beforeshipid = aftership.before_shipid;
        let aftership_beforeshiplv = aftership.before_shiplv;
        if (aftership_beforeshipid) {
          if (afterlv < aftership_beforeshiplv) {
            aftership.before_shipid = p;
            aftership.before_shiplv = afterlv;
          }
        } else {
          aftership.before_shipid = p;
          aftership.before_shiplv = afterlv;
        }
      }
    }
    let list = [];
    for (let p in $ships) {
      let ship = $ships[p];
      let afterlv = ship.api_afterlv;
      let aftershipid = ship.api_aftershipid;
      if (afterlv && aftershipid) {
        if (ship.before_shipid == undefined) {
          list.push(p);
        }
      }
    }
    list.sort(function (a, b) {
      return 8 * ($ships[a].api_stype - $ships[b].api_stype) + $ships[a].api_name.localeCompare($ships[b].api_name)
    });
    return list;
  }

  hiddenShipList = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({show_shipList: false});
  };

  showShipList = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({show_shipList: true, input_shipList: ''}, this.changeHandler(e, true));
  };

  changeHandler = (e, ...other) => {
    e.preventDefault();
    e.stopPropagation();
    let allship = [], $ship = this.props.$ships, expStr = e.target.value;
    if (other.length == 1 && other[0]) {
      expStr = ''
    }
    this.simplfyship().map((id) => {
      if (new RegExp(expStr, 'i').test($ship[id].api_name))
        allship.push(id);
    });
    this.setState({ship_targets: allship, input_shipList: e.target.value})
  };

  selectShip = e => {
    e.stopPropagation();
    let $ships = this.props.$ships, option = e.currentTarget.value;
    if (option != 0) {
      this.setState({input_shipList: $ships[option].api_name});
    }
    this.handleFormChange(e);
  };

  handleNewShip = e => {
    e.preventDefault();
    e.stopPropagation();
    let nl = this.state.notify_list;
    if (nl.newShip != 'undefined') {
      nl.newShip = !nl.newShip;
    } else {
      nl.newShip = true
    }
    this.savelist();
    this.setState({notify_list: nl})
  };

  render() {
    try {
      return this.render_D();
    } catch (e) {
      console.log(e);
      return (
        <div>
          unknown error
        </div>
      )
    }
  }

  get_statistic_info(shipid){
    this.setState({detail:{}});
    var that=this;
    fetch('http://db.kcwiki.moe/drop/ship/'+shipid+'/SAB.json')
      .then(res => res.json())
      .then(function(response){
        that.setState({detail:response})
      });
  }



  render_D() {
    const {$ships, horizontal} = this.props;
    const $shipTypes = this.props.$shipTypes;
    const createList = arr => {
      let out = [];
      arr.map((option) => {
        const shipinfo = $ships[option],
          shipname = shipinfo.api_name,
          shiptypeid = shipinfo.api_stype,
          shiptypename = $shipTypes[shiptypeid].api_name;
        out.push(
          <li onMouseDown={this.selectShip} value={option}>
            <a>
              {shiptypename + ' : ' + shipname}
            </a>
          </li>
        )
      });
      return out;
    };

    const detaildata = this.state.detail.data;
    console.log(detaildata);
    var detailkeys=[]
    if(detaildata){
      detailkeys = Object.keys(detaildata);
      detailkeys.sort(function(a,b){return detaildata[b].rate-detaildata[a].rate})
    }
    return (
      <div id="notify" className="notify">
        <link rel="stylesheet" href={join(__dirname, 'notify.css')}/>
        <Row>
          <Col xs={12}>
            <form className="input-select">
              <FormGroup>
                <FormControl type="text" placeholder="选择或输入要提醒的舰船" ref="shipInput" value={this.state.input_shipList}
                             onChange={this.changeHandler} onFocus={this.showShipList}
                             onBlur={this.hiddenShipList}/>
              </FormGroup>
              <ul className="ship-list dropdown-menu" style={{display: this.state.show_shipList ? 'block' : 'none'}}>
                {createList(this.state.ship_targets)}
              </ul>
            </form>
          </Col>
        </Row>
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>位置</th>
              <th>司令部lv</th>
              <th>S</th>
              <th>A</th>
              <th>B</th>
              <th>rate</th>
            </tr>
          </thead>
          <tbody>
          {
            detailkeys.map(function(dropkey){
              const dropdata = detaildata[dropkey];
              return(
                <tr>
                  <td>{dropkey}</td>
                  <td>{dropdata.hqLv[0]}-{dropdata.hqLv[1]}</td>
                  <td>{dropdata.rankCount[0]}</td>
                  <td>{dropdata.rankCount[1]}</td>
                  <td>{dropdata.rankCount[2]}</td>
                  <td>{dropdata.rate}%</td>
                </tr>
              )
            })
          }
          </tbody>
        </Table>
      </div>
    )
  }
});




























