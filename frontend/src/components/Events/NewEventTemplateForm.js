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

import React, {useContext, useEffect, useState} from 'react';
import {sortListByName, useTimeKeeperAPI, useTimeKeeperAPIPost} from '../../utils/services';
import {Alert, Button, Col, DatePicker, Form, Input, message, Radio, Row, Select, Space, Spin} from 'antd';
import './NewEventTemplateForm.less';
import '../../components/Button/BtnGeneral.less';
import {Link, Redirect} from 'react-router-dom';
import TitleSection from '../../components/Title/TitleSection';
import moment from 'moment';
import UserTreeData from './UserTreeData';
import _ from 'lodash';
import 'moment/locale/en-gb';
import {UserContext} from '../../context/UserContext';
import PropTypes from 'prop-types';

const {TextArea} = Input;
const { RangePicker } = DatePicker;
const {Option} = Select;

const USER_EVENTS = ['Vacations', 'Sickness', 'Maternity/Paternity leave', 'Family event'];

const NewEventTemplateForm = ({eventType}) => {
  const {currentUser} = useContext(UserContext);
  const [eventTemplateCreated, setEventTemplateCreated] = useState(false);
  const [usersSelected, setUsersSelected] = useState([]);
  const [currentEventType, setCurrentEventType] = useState(eventType);
  const [userEventUserType, setUserEventUserType] = useState('myself');

  const companyEventFormData = (formData) => ({
    name: formData.name,
    description: formData.description,
    startDateTime: formData.eventDateTime[0],
    endDateTime: formData.eventDateTime[1],
    attendees: usersSelected
  });
  console.log(usersSelected);
  const userEventFormData = (formData) => ({
    name: formData.name,
    description: formData.description,
    startDateTime: formData.eventDateTime[0],
    endDateTime: formData.eventDateTime[1],
    userId: _.get(usersSelected[0], 'userId', currentUser.id),
    creatorId: currentUser.id,
    eventType: 'PERSONAL'
  });
  const usersResponse = useTimeKeeperAPI('/api/users');
  const eventsResponse = useTimeKeeperAPI('/api/users');
  const apiCallCompanyEventPOST = useTimeKeeperAPIPost('/api/events-template', (form => form), setEventTemplateCreated, companyEventFormData);
  const apiCallUserEventPOST = useTimeKeeperAPIPost('/api/user-events', (form => form), setEventTemplateCreated, userEventFormData);

  const [form] = Form.useForm();

  const initialValues = {
    name: '',
    description: '',
    eventDateTime: [moment.utc('9:00 AM', 'LT'), moment.utc('9:00 AM', 'LT')],
    attendees: [],
    eventType: currentEventType,
    eventName: ''
  };

  useEffect(() => {
    if (!eventTemplateCreated) {
      return;
    }
    message.success('Event was created');
  }, [eventTemplateCreated]);

  if (eventTemplateCreated) {
    return (
      <React.Fragment>
        <Redirect to="/events"/>
      </React.Fragment>
    );
  }

  const disabledDate = (current) => {
    // Can not select days before today and today
    return current && current < moment().subtract(1,'days').endOf('day');
  };

  function disabledTime(time, type) {
    if (type === 'start') {
      return {
        disabledHours() {
          let morning =  _.range(0, 7);
          let evening =  _.range(20, 24);
          return _.concat(morning,evening);
        },
        disabledMinutes: function () {
          return _.filter(_.range(0, 60), function (x) {
            return x % 15 !== 0;
          });
        },
        disabledSeconds() {
          return _.range(0, 60);
        },
      };
    }
    return {
      disabledHours() {
        let morning =  _.range(0, 7);
        let evening =  _.range(20, 24);
        return _.concat(morning,evening);
      },
      disabledMinutes: function () {
        return _.filter(_.range(0, 60), function (x) {
          return x % 15 !== 0;
        });
      },
      disabledSeconds() {
        return _.range(0, 60);
      },
    };
  }

  const eventColumn = () => {
    return (<Col className="gutter-row" span={12}>
      <TitleSection title="Information"/>

      <Form.Item label="Event type:" name="eventType" rules={[{required: true}]}>
        <Radio.Group>
          <Radio.Button value="COMPANY">Company event</Radio.Button>
          <Radio.Button value="PERSONAL">User event</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item shouldUpdate={(prevValues, curValues) =>
      {
        const out = prevValues.eventType !== curValues.eventType || prevValues.eventName !== curValues.eventName;
        if(out === true) {
          setCurrentEventType(curValues.eventType);
        }
        return out;
      }}>
        {() => {
          switch (currentEventType) {
            case 'PERSONAL':
              return (
                <Form.Item
                  name="name"
                  label="Events"
                  rules={[{required: true}]}
                >
                  <Select>{USER_EVENTS.map(i =>
                    <Option key={`option-event-${i}`} value={i}>{i}</Option>)}
                  </Select>
                </Form.Item>
              );
            case 'COMPANY':
              return (
                <Form.Item
                  name="name"
                  label="Events"
                  rules={[{required: true}]}
                >
                  <Input placeholder="Please enter event's name" type="text"/>
                </Form.Item>
              );
            default:
              return (<div></div>);
          }
        }}
      </Form.Item>

      <Form.Item
        label="Description :"
        name="description"
      >
        <TextArea
          rows={4}
          placeholder="A short description about this event"
        />
      </Form.Item>

      <Form.Item
        label="Date and duration"
        name="eventDateTime"
        rules={[
          {
            required: true,
          },
        ]}
      >

        <RangePicker
          disabledDate={disabledDate}
          disabledTime={disabledTime}
          showTime={{
            hideDisabledOptions: true
          }}
          format="DD-MM-YYYY HH:mm"
          className="tk_RangePicker"
        />
      </Form.Item>
    </Col>);
  };

  const userColumn = () => {
    return (<Col className="gutter-row" span={12}>
      <TitleSection title="Users"/>
      <Form.Item
        label="Select users :"
        name="usersSelected"
      >
        <UserTreeData users={sortListByName(usersResponse.data)} usersSelected={usersSelected} setUsersSelected={setUsersSelected} eventType="companyEvent"/>
      </Form.Item>
    </Col>);
  };

  const onChangeUserRadioButton = (value) => {
    setUserEventUserType(value.target.value);
  };

  const userEventColumn = () => {
    return (<Col className="gutter-row" span={12}>
      <TitleSection title="Users"/>
      <Form.Item
        label="User Type :"
        name="userType"
        initialValue="myself"
      >
        <Radio.Group onChange={onChangeUserRadioButton}>
          <Radio value="myself">Myself</Radio>
          <Radio value="otherUser">Other user</Radio>
        </Radio.Group>
      </Form.Item>
      {(userEventUserType === 'otherUser') ?
        <Form.Item
          label="Select single user :"
          name="usersSelected"
        >
          <UserTreeData users={sortListByName(usersResponse.data)} usersSelected={usersSelected} setUsersSelected={setUsersSelected} eventType="userEvent"/>
        </Form.Item>: ''}

    </Col>);
  };

  const renderColumns = () => {
    if(currentEventType === 'COMPANY') {
      return (
        <React.Fragment>
          {eventColumn()}
          {userColumn()}
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          {eventColumn()}
          {userEventColumn()}
        </React.Fragment>
      );
    }
  };

  if(eventsResponse.data && usersResponse.data){
    return (
      <Form
        id="tk_Form"
        layout="vertical"
        initialValues={initialValues}
        onFinish={(currentEventType === 'COMPANY') ? apiCallCompanyEventPOST.run : apiCallUserEventPOST.run}
        form={form}
      >
        {apiCallCompanyEventPOST.error &&
            <Alert
              message="Unable to save the new Event"
              description={apiCallCompanyEventPOST.error.data.message}
              type="error"
              closable
              style={{marginBottom: 10}}
            />}
        <div className="tk_CardLg">
          <Row gutter={16}>
            {renderColumns()}
          </Row>

          <Space className="tk_JcFe" size="middle" align="center">
            <Link id="tk_Btn" className="tk_BtnSecondary" key="cancelLink" to={'/events'}>Cancel</Link>
            <Button id="tk_Btn" className="tk_BtnPrimary" htmlType="submit">Submit</Button>
          </Space>
        </div>
      </Form>
    );
  }

  if (eventsResponse.loading || usersResponse.loading) {
    return (
      <React.Fragment>
        <Spin size="large">
          <Form
            labelCol={{span: 4}}
            wrapperCol={{span: 14}}
            layout="horizontal"
          >
            <Form.Item label="Name" name="name">
              <Input placeholder="Loading data from server..."/>
            </Form.Item>
            <Form.Item label="Description" name="description">
              <TextArea
                rows={4}
                placeholder="Loading data from server..."
              />
            </Form.Item>
          </Form>
        </Spin>

      </React.Fragment>
    );
  }

  if (eventsResponse.error || usersResponse.error) {
    return (
      <React.Fragment>
        <Alert title='Server error'
          message='Failed to load the data'
          type='error'
        />
      </React.Fragment>
    );
  }

};

NewEventTemplateForm.propTypes = {
  eventType: PropTypes.string
};

export default NewEventTemplateForm;