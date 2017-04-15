import React, {Component} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'

import {store} from 'views/create-store'

import {join} from 'path'
import {FormGroup, FormControl, ListGroup, ListGroupItem, Button, Row, Col, Table, ButtonGroup} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import getShipRare from './drop_map'


import {extensionSelectorFactory} from 'views/utils/selectors'
const fs = require('fs')
const zh = "阿八嚓哒妸发旮哈或讥咔垃麻拏噢妑七呥撒它拖脱穵夕丫帀坐".split('');
export const reactClass = connect(
  state => ({
    horizontal: state.config.poi.layout || 'horizontal',
    $ships: state.const.$ships,
    $shipTypes: state.const.$shipTypes,
    allmaps:state.fcd?state.fcd.map:{}
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
      sortFlag: 'rate',
      nowmap:undefined,
      searchShipId: '',
      searchMapPoint: '',
      imgurl:'',
      savedurl:{},
      searchType: ''
    }
  }

  componentWillReceiveProps(nextProps) {
  }

  handleFormChange(e) {
    this.setState({
      searchShipId: e.currentTarget.value,
      searchType: 'ship'
    });
    this.get_statistic_info(e.currentTarget.value);
  }

  simplfyship() {
    try {
      var ships=this.simplfyship_D();
      var maps = [];
      var list = maps.concat(ships);
      return list;
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
    let lowstr = expStr.toLowerCase();
    this.simplfyship().map((id) => {
      var shipname;
      if(id.indexOf(":")>0){
        shipname=id;
      }else{
        shipname = $ship[id].api_name;
      }
      if(lowstr>='a'&&lowstr<='z'){
        var match=true;
        for(var i=0;i<lowstr.length;i++){
          var x=lowstr.charCodeAt(i)-97;
          var cs=zh[x];
          var ce=zh[x+1];
          if(shipname.charAt(i).localeCompare(cs)>0&&shipname.charAt(i).localeCompare(ce)<0){

          }else{
            match=false;
            break;
          }
        }
        if(match){
          allship.push(id);
        }
      }
      if (new RegExp(expStr, 'i').test(shipname))
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


  selectMap = e => {
    e.preventDefault();
    e.stopPropagation();
    if(e.currentTarget.value != '0'){
      let option = e.currentTarget.value;
      let mapurl = "https://db.kcwiki.moe/drop/map/" + option.split("-").join('');
      fetch(mapurl)
        .then(res => {
          let url = res.url;
          let uri = url.substring(url.indexOf('/map') + 5, url.indexOf('-SAB'));
          this.setState({
            searchMapPoint: uri,
            searchType: 'map'
          });
          this.get_statistic_info_by_map(uri);
        });
      this.getMapImgUrl(option);
    } else {
      this.setState({nowmap: ''})
    }
  };

  getMapImgUrl(mapid){
    var savedurl = this.state.savedurl;
    var imgObj = savedurl[mapid];
    if(imgObj){
      this.setState({nowmap:mapid,imgurl:imgObj.img,detail:''});
    }else{
      var mapurl = "https://db.kcwiki.moe/drop/map/"+mapid.split("-").join('');
      /*
      if(parseInt(mapid)>30){
        var url = "https://db.kcwiki.moe/drop/map/"+ mapid.split("-").join('') +"/3/A-SAB.html";
      }else {
        var url = "https://db.kcwiki.moe/drop/map/" + mapid.split("-").join('') + "/A-SAB.html";
      }
      */
      const _this=this;
      var url = '';
      fetch(mapurl)
        .then(function(res){
          url = res.url;
          return res.text();
        }).then(function(response){
          var n = url.lastIndexOf("SAB.html");
          var defaultPoint = url.substring(n-2,n-1);
          var imgurlnew = _this.getMapImgUrlFromHtml(response);
          savedurl[mapid]={img:imgurlnew,point:defaultPoint};
          _this.setState({nowmap:mapid,imgurl:imgurlnew,detail:'',savedurl:savedurl});
        });
    }

  }

  getMapImgUrlFromHtml(htmlstr){
    var n = htmlstr.indexOf('https://upload.kcwiki.moe');
    var sub1 = htmlstr.substring(n);
    var n1 = sub1.indexOf('>');
    var imgurl = sub1.substring(0,n1-1);
    return imgurl;
  }

  selectPoint = e => {
    e.preventDefault();
    e.stopPropagation();
    if(e.currentTarget.value != '0'){
      let option = e.currentTarget.value;
      let sp = option.split(','), map = sp[0], point = sp[1], level = sp[2],
        uri = `${map.replace(/\-/g, '')}/${level ? level + '/' : ''}${point}`;
      this.setState({
        searchMapPoint: uri,
        searchType: 'map'
      });
      this.get_statistic_info_by_map(uri);
    }
  }

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

  get_statistic_info_by_map(...value){
    this.setState({detail:{}});
    const _this = this;
    fetch('http://db.kcwiki.moe/drop/map/'+ value[0] +'-'+ (value.length - 1? value[1]: this.state.battle_rank) +'.json')
      .then(res => res.json())
      .then(function(response){
        _this.setState({detail:response,sortFlag: 'name'})
      });
  }


  get_statistic_info(...value){
    this.setState({detail:{}});
    const _this = this;
    fetch('http://db.kcwiki.moe/drop/ship/'+ value[0] +'/'+ (value.length - 1? value[1]: this.state.battle_rank) +'.json')
      .then(res => res.json())
      .then(function(response){
        _this.setState({detail:response,sortFlag: 'rate',imgurl:''})
      });
  }

  changeRank = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({battle_rank: e.target.text});
    switch(this.state.searchType){
      case 'ship':
        this.get_statistic_info(this.state.searchShipId, e.target.text);
        break;
      case 'map':
        this.get_statistic_info_by_map(this.state.searchMapPoint, e.target.text);
        break;
      default:
        break;
    }
    const sortFlag = this.state.sortFlag;
    if(sortFlag != 'rate' && sortFlag != 'name' && e.target.text.length - 1 < sortFlag){
      if(this.state.searchType=='map'){
        this.setState({sortFlag: 'name'})
      }else{
        this.setState({sortFlag: 'rate'})
      }

    }
  };

  sortList = e =>{
    e.preventDefault();
    e.stopPropagation();
    this.setState({sortFlag: e.target.getAttribute('value')})
  }



  render_D() {
    const { $ships } = this.props;
    const $shipTypes = this.props.$shipTypes;
    const rankLevel = ['SAB', 'SA', 'S', 'A', 'B'];
    const allmaps = this.props.allmaps;
    let mapkeys = Object.keys(allmaps);
    let fmapkey = [];
    let bmapkey = [];
    let maxmap = 30;
    for(var p in allmaps){
      if(parseInt(p)>maxmap){
        maxmap=parseInt(p);
      }
    }
    for(var p in allmaps){
      if(parseInt(p)==maxmap){
        fmapkey.push(p);
      }else{
        bmapkey.push(p);
      }
    }
    mapkeys=fmapkey.concat(bmapkey);
    const selectedmap = this.state.nowmap;
    const mapdetail = selectedmap?allmaps[selectedmap]:{spots:{}};
    const createList = arr => {
      let out = [];
      arr.map((option) => {
        if(option.indexOf(":")>0){
          out.push(
            <li onMouseDown={this.selectShip} value={option}>
              <a>
                {option}
              </a>
            </li>
          )
        }else{
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
        }

      });
      return out;
    };

    const detaildata = this.state.detail.data;
    var detailkeys=[]
    if(detaildata){
      detailkeys = Object.keys(detaildata);
      const sortFlag = this.state.sortFlag;
      switch(sortFlag) {
        case 'name':
          detailkeys.sort((a, b) => (getShipRare(a)-getShipRare(b)) * -100 + detaildata[b].rate - detaildata[a].rate); break;
        case 'rate':
          detailkeys.sort((a, b) => detaildata[b].rate - detaildata[a].rate); break;
        default:
          if(!!detaildata[detailkeys[0]].rankCount){
            detailkeys.sort((a, b) => detaildata[b].rankCount[sortFlag] - detaildata[a].rankCount[sortFlag])
          } else {
            detailkeys.sort((a, b) => detaildata[b].totalCount - detaildata[a].totalCount);
          }
          break;
      }
    }
    let points = Object.keys(mapdetail.spots).sort(),
      bossPoint = selectedmap && this.state.savedurl[selectedmap] ? this.state.savedurl[selectedmap].point : 'none';
    return (
      <div id="statistic" className="statistic">
        <link rel="stylesheet" href={join(__dirname, 'statistic.css')}/>
        <Row>
          <Col xs={12}>
            <form className="input-select">
              <FormGroup>
                <FormControl type="text" placeholder="请选择" ref="shipInput" value={this.state.input_shipList}
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
          <Col xs={6}>
            <FormControl componentClass="select" onChange={this.selectMap}>
              <option value="0">请选择海域</option>
              {mapkeys.map(function(amap){
                return(
                  <option value={amap}>{amap}</option>
                )
              })}
            </FormControl>
          </Col>
          <Col xs={6}>
            <FormControl componentClass="select" onChange={this.selectPoint}>
              <option value="0">请选择海域中位置</option>
              {
                points.map((point) => {
                  if(!parseInt(point)){
                    if(parseInt(selectedmap) > 10){
                      const hardlevel = ["甲", "乙", "丙"];
                      return hardlevel.map((level, index) =>
                        <option value={[selectedmap, point, 3 - index]} selected={point == bossPoint && !index ? 'selected' : ''}>
                          {point}
                          {point == bossPoint ? '(Boss)' : ''}
                          ({level})
                        </option>
                      )
                    } else {
                      return(
                        <option value={[selectedmap, point]} selected={point == bossPoint ? 'selected' : ''}>
                          {point}
                          {point == bossPoint ? '(Boss)' : ''}
                        </option>
                      )
                    }
                  }
                })
              }
            </FormControl>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <ButtonGroup justified>
              {
                rankLevel.map(level =>
                    <Button
                      onClick={this.changeRank}
                      href="javascript:;"
                      bsStyle={this.state.battle_rank == level? 'info': 'default'}
                    >
                      {level}
                    </Button>)
              }
            </ButtonGroup>
          </Col>
        </Row>
        <div>
          {
            this.state.imgurl?<img width={340} src={this.state.imgurl}></img>:<span></span>
          }
        </div>
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th onClick={this.sortList} value="name">
                {this.state.searchType == 'map'? '舰娘': '位置'}&nbsp;&nbsp;
                {this.state.sortFlag == 'name' ? <FontAwesome name="sort-amount-desc" onClick={e => {e.stopPropagation()}}/> : ''}
              </th>
              {
                this.state.battle_rank.split('').map(
                  (rank, index) =>
                    <th onClick={this.sortList} value={index}>
                      {rank}&nbsp;&nbsp;
                      {this.state.sortFlag == index ? <FontAwesome name="sort-amount-desc" onClick={e => {e.stopPropagation()}}/> : ''}
                    </th>
                )
              }
              <th onClick={this.sortList} value="rate">
                rate&nbsp;&nbsp;
                {this.state.sortFlag == 'rate' ? <FontAwesome name="sort-amount-desc" onClick={e => {e.stopPropagation()}}/> : ''}
              </th>
            </tr>
          </thead>
          <tbody>
          {
            detailkeys.map(dropkey =>{
              const dropdata = detaildata[dropkey];
              let keydata=[];
              if(this.state.searchType=='map'){
                const rare = getShipRare(dropkey);
                if(rare){
                  keydata.push(<span className="rare-ship">{dropkey}</span>);
                }else{
                  keydata.push(<span>{dropkey}</span>);
                }
              }else{
                keydata.push(<span>{dropkey}</span>);
              }
              return(
                <tr>
                  <td>
                    {keydata}
                  </td>
                  {dropdata.rankCount? dropdata.rankCount.map(rank => <td>{rank}</td>) : <td>{dropdata.totalCount}</td>}
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