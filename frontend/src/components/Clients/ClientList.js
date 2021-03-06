/*
 * Copyright 2020 Lunatech S.A.S
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {useState} from 'react';
import {Alert, AutoComplete, Avatar, Button, Card, Collapse, List, Spin} from 'antd';
import './ClientList.less';
import {sortListByName, useTimeKeeperAPI} from '../../utils/services';
import FolderFilled from '@ant-design/icons/lib/icons/FolderFilled';
import EditFilled from '@ant-design/icons/lib/icons/EditFilled';
import Tooltip from 'antd/lib/tooltip';
import Space from 'antd/lib/space';
import Tag from 'antd/lib/tag';
import UserOutlined from '@ant-design/icons/lib/icons/UserOutlined';
import FolderOpenOutlined from '@ant-design/icons/lib/icons/FolderOpenOutlined';
import Input from 'antd/lib/input';
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined';
import Meta from 'antd/lib/card/Meta';
import CardXs from '../Card/CardXs';
import Pluralize from '../Pluralize/Pluralize';
import _ from 'lodash';
const { Panel } = Collapse;

const ClientList = () => {

  const clientsResponse = useTimeKeeperAPI('/api/clients');

  const [value, setValue] = useState('');

  const onSearch = searchText => setValue(searchText);

  const clientsFiltered = () => clientsResponse.data.filter(d => d.name.toLowerCase().includes(value.toLowerCase())).sort((a,b)=>{
    if(a.name.toLowerCase() < b.name.toLowerCase()){return -1;}
    if(a.name.toLowerCase() > b.name.toLowerCase()){return 1;}
    return 0;
  });

  const getLogoURL = (item) => {
    if(item && item.name) {
      let cleanSeed = _.snakeCase(item.name);
      return 'https://picsum.photos/seed/' + cleanSeed + '/40';
    }else{
      return 'https://picsum.photos/40';
    }
  };

  if (clientsResponse.loading) {
    return (
      <React.Fragment>
        <Spin size="large">
          <p>Loading client</p>
        </Spin>
      </React.Fragment>

    );
  }
  if (clientsResponse.error) {
    return (
      <React.Fragment>
        <Alert title='Server error'
          message='Failed to load the list of clients'
          type='error'
          description='check that the authenticated User has role [user] on Quarkus'
        />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="tk_SubHeader">
        <p><Pluralize label="client" size={clientsFiltered().length}/></p>
        <div className="tk_SubHeader_RightPart">
          <div className="tk_Search_Input">
            <AutoComplete onSearch={onSearch}>
              <Input data-cy="searchClientBox" size="large" placeholder="Search in clients..." allowClear  prefix={<SearchOutlined />} />
            </AutoComplete>
          </div>
        </div>
      </div>

      <List
        id="tk_List"
        grid={{ gutter: 32, column: 3 }}
        dataSource={clientsFiltered()}
        renderItem={item => (
          <List.Item key={item.id}>
            <Card
              id="tk_Card_Sm"
              bordered={false}
              title={
                <Space size={'middle'}>
                  <Avatar src={getLogoURL(item)} shape={'square'} size="large"/>
                  <div className="tk_Card_ClientHeader">
                    <p className="tk_Card_ClientTitle">{item.name}</p>
                    <p className="tk_Card_ClientNbProject"><Pluralize label="project" size={item.projects.length}/></p>
                  </div>
                </Space>
              }
              extra={[
                <Tooltip title="Edit" key="edit">
                  <Button data-cy="editClient" type="link" size="small" ghost shape="circle" icon={<EditFilled/>} href={`/clients/${item.id}/edit`}/>
                </Tooltip>
              ]}
              actions={[ item.projects.length === 0 ? <Panel id="tk_ProjectNoCollapse" header={<Space size="small"><FolderFilled />{'No project'}</Space>} key="1"/> :
                <Collapse bordered={false} expandIconPosition={'right'} key="projects">
                  <Panel header={<Space size="small"><FolderOpenOutlined /><Pluralize label="project" size={item.projects.length} /></Space>} key="1">
                    <List
                      id={'tk_ClientProjects'}
                      dataSource={sortListByName(item.projects)}
                      renderItem={projectItem => (
                        <List.Item>
                          <a href={`/projects/${projectItem.id}`}>
                            <CardXs>
                              <p>{projectItem.name}</p>
                              <Tag id="tk_UsersTag" icon={<UserOutlined />}>{projectItem.userCount}</Tag>
                            </CardXs>
                          </a>
                        </List.Item>
                      )}
                    />
                  </Panel>
                </Collapse>
              ]}
            >
              <Meta
                description={item.description}
              />
            </Card>
          </List.Item>
        )}
      />
    </React.Fragment>
  );
};

export default ClientList;