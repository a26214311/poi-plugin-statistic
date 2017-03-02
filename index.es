import React, {Component} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'

import {store} from 'views/create-store'

import {join} from 'path'
import {FormGroup, FormControl, ListGroup, ListGroupItem, Button, Row, Col, Table, ButtonGroup} from 'react-bootstrap'
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
      detail:{},
      battle_rank: 'SAB',
      searchShipId: ''
    }
  }

  componentWillReceiveProps(nextProps) {
  }

  handleFormChange(e) {
    this.setState({searchShipId: e.currentTarget.value});
    this.get_statistic_info(e.currentTarget.value);
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

  get_statistic_info(...value){
    console.log(value);
    console.log(this.state.searchShipId);
    console.log(this.state.battle_rank)
    console.log('http://db.kcwiki.moe/drop/ship/'+ value[0] +'/'+ (value.length - 1? value[1]: this.state.battle_rank) +'.json')
    this.setState({detail:{}});
    var that=this;
    fetch('http://db.kcwiki.moe/drop/ship/'+ value[0] +'/'+ (value.length - 1? value[1]: this.state.battle_rank) +'.json')
      .then(res => res.json())
      .then(function(response){
        that.setState({detail:response})
      });
  }

  changeRank = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({battle_rank: e.target.text});
    if(this.state.searchShipId){
      this.get_statistic_info(this.state.searchShipId, e.target.text)
    }
  };



  render_D() {
    const {$ships, horizontal} = this.props;
    const $shipTypes = this.props.$shipTypes;
    const rankLevel = ['SAB', 'SA', 'S', 'A', 'B'];
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
    }
    return (
      <div id="statistic" className="statistic">
        <link rel="stylesheet" href={join(__dirname, 'statistic.css')}/>
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
        <Row>
          <Col xs={12}>
            <ButtonGroup justified>
              {
                rankLevel.map((level) => {
                  return(
                    <Button
                      onClick={this.changeRank}
                      href="javascript:;"
                      bsStyle={this.state.battle_rank == level? 'success': 'danger'}
                    >
                      {level}
                    </Button>
                  )
                })
              }
            </ButtonGroup>
          </Col>
        </Row>
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>位置</th>
              {
                this.state.battle_rank.split('').map(
                  rank => <th>{rank}</th>
                )
              }
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
                  {
                    dropdata.rankCount? dropdata.rankCount.map(rank => {
                      return(
                        <td>{rank}</td>
                      )
                    }) : <td>{dropdata.totalCount}</td>
                  }
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




























