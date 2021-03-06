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
import {Alert, Button, Col, Form, Input, message, Radio, Row, Select, Space, Spin} from 'antd';
import EventDateAndHoursPicker from './EventDateAndHoursPicker';
import '../../components/Button/BtnGeneral.less';
import {Link, Redirect} from 'react-router-dom';
import TitleSection from '../../components/Title/TitleSection';
import moment from 'moment';
import _ from 'lodash';
import 'moment/locale/en-gb';
import {UserContext} from '../../context/UserContext';
import EventTypeIcon from './EventTypeIcon';
import UserTreeData from './UserTreeData';
import PropTypes from 'prop-types';
import './NewEventTemplateForm.less';
import EventDuration from './EventDuration';
import EventDatePickerFormItem from './EventDatePickerFormItem';
import EventHoursDropDownFormItem from './EventHoursDropDownFormItem';
import EventHoursRadioGroupFormItem, {EventHoursRadioGroupValues} from './EventHoursRadioGroupFormItem';

const {TextArea} = Input;
const {Option} = Select;

const USER_EVENTS = ['Vacations', 'Sickness', 'Maternity/Paternity leave', 'Family event'];

const NewEventTemplateForm = ({eventType}) => {
  const {currentUser} = useContext(UserContext);
  const [eventTemplateCreated, setEventTemplateCreated] = useState(false);
  const [usersSelected, setUsersSelected] = useState([]);
  const [currentEventType, setCurrentEventType] = useState(eventType);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [userEventUserType, setUserEventUserType] = useState('myself');
  const [startDate, setStartDate] = useState(null);
  const [startDateHours, setStartDateHours] = useState(0);
  const [endDate, setEndDate] = useState(null);
  const [endDateHours, setEndDateHours] = useState(0);

  const formDataMapping = {
    start: (formData) => {
      return moment(formData.firstDay)
        .startOf('day')
        .add(17 - _.get(formData, 'firstDayDuration', 0), 'hours')
        .utc(true);
    },
    end: (formData, multiDay) => {
      return multiDay ? moment(formData.lastDay)
        .startOf('day')
        .add(9 + _.get(formData, 'lastDayDuration', 0), 'hours')
        .utc(true)
        : moment(formData.firstDay)
          .startOf('day')
          .add(17, 'hours')
          .utc(true);
    }
  };

  const companyEventFormData = (formData) => {
    return {
      name: formData.name,
      description: formData.description,
      startDateTime: formDataMapping.start(formData),
      endDateTime: formDataMapping.end(formData, isMultiDay),
      attendees: usersSelected
    };
  };

  const userEventFormData = (formData) => {
    return {
      name: formData.name,
      description: formData.description,
      startDateTime: formDataMapping.start(formData),
      endDateTime: formDataMapping.end(formData, isMultiDay),
      userId: _.get(usersSelected[0], 'userId', currentUser.id),
      creatorId: currentUser.id,
      eventType: EventTypes.PERSONAL
    };
  };

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
    isMultiDay: false,
    eventName: ''
  };

  const EventTypes = {
    PERSONAL: 'PERSONAL',
    COMPANY: 'COMPANY'
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

  const renderDatePickers = (onStartDateChange, onStartHoursChange, onEndDateChange, onEndHoursChange) => {

    const startDatePicker = () => {
      return (
        <EventDatePickerFormItem
          label={isMultiDay ? 'First Day:' : 'Date:'}
          name="firstDay"
          onChange={onStartDateChange}
          isRequired={true}
          message="When is the start of this event?"
          disabledDates={(current) => {
            if(isMultiDay && !_.isNull(endDate)) {
              return current && current > moment(endDate).subtract(1,'days').endOf('day');
            }
          }}
        />
      );
    };
    const startHoursPicker = () => {
      return (
        <EventHoursDropDownFormItem
          label="Number of hours"
          name="firstDayDuration"
          isRequired={true}
          message="Choose how many hours"
          onChange={onStartHoursChange}/>
      );
    };
    const endDatePicker = () => {
      return (
        <EventDatePickerFormItem
          label="Last Day"
          name="lastDay"
          onChange={onEndDateChange}
          isRequired={true}
          message="When is the end of this event?"
          disabledDates={(current) => current && current < moment(startDate).endOf('day')}
        />
      );
    };
    const endHoursPicker = () => {
      return (
        <EventHoursDropDownFormItem
          label="Number of hours"
          name="lastDayDuration"
          isRequired={true}
          message="Choose how many hours"
          onChange={onEndHoursChange}/>
      );
    };

    switch (currentEventType) {
      case EventTypes.PERSONAL:
        return (
          <div className="tk_DateAndHoursGen">
            <EventDateAndHoursPicker
              cssClass="tk_DateAndHours"
              datePicker={startDatePicker()}
              hoursPicker={
                <EventHoursRadioGroupFormItem
                  label="Duration:"
                  name="firstDayDuration"
                  isRequired={true}
                  message="Please choose chunk of day"
                  onChange={onStartRadioHoursChange}
                  value={_.includes(EventHoursRadioGroupValues, startDateHours) ? startDateHours : null}
                />
              }/>
            {
              isMultiDay ? <EventDateAndHoursPicker
                cssClass="tk_DateAndHours"
                datePicker={endDatePicker()}
                hoursPicker={
                  <EventHoursRadioGroupFormItem
                    label="Duration:"
                    name="lastDayDuration"
                    isRequired={true}
                    message="Please choose chunk of day"
                    onChange={onEndRadioHoursChange}
                    value={_.includes(EventHoursRadioGroupValues, endDateHours) ? endDateHours : null}
                  />
                }
              />
                : <></>
            }
          </div>);
      case EventTypes.COMPANY:
        return (
          <div className="tk_DateAndHoursGen">
            <EventDateAndHoursPicker
              cssClass="tk_DateAndHours"
              datePicker={startDatePicker()}
              hoursPicker={startHoursPicker()}/>
            {
              isMultiDay ? <EventDateAndHoursPicker
                cssClass="tk_DateAndHours"
                datePicker={endDatePicker()}
                hoursPicker={endHoursPicker()}
              />
                : <></>
            }
          </div>
        );
    }
  };

  const eventColumn = () => {
    return (
      <Col className="gutter-row" span={12}>
        <TitleSection title="Information"/>

        <Form.Item label="Event type:" name="eventType" rules={[{required: true}]}>
          <Radio.Group className="tk_EventType_RadioGroup">
            <Row>
              <Col span={12}>
                <Radio.Button value="COMPANY" className="tk_EventType_RadioButton">
                  <EventTypeIcon iconName="BankOutlined" text="Company Event" />
                </Radio.Button>
              </Col>
              <Col span={12}>
                <Radio.Button value="PERSONAL" className="tk_EventType_RadioButton">
                  <EventTypeIcon iconName="UserOutlined" text="Personal Event" />
                </Radio.Button>
              </Col>
            </Row>
          </Radio.Group>
        </Form.Item>

        <span className="tk_EventForm_Delimiter"/>

        <Form.Item shouldUpdate={(prevValues, curValues) =>
        {
          const out = prevValues.eventType !== curValues.eventType || prevValues.eventName !== curValues.eventName;
          if(out === true) {
            if(_.isEqual(curValues.eventType, EventTypes.PERSONAL)) {
              if(!_.includes(EventHoursRadioGroupValues, startDateHours)) {
                form.resetFields(['firstDayDuration', [null]]);
                setStartDateHours(0);
              }
              if(!_.includes(EventHoursRadioGroupValues, endDateHours)) {
                form.resetFields(['lastDayDuration', [null]]);
                setEndDateHours(0);
              }
            }
            setCurrentEventType(curValues.eventType);
          }
          return out;
        }}>
          {() => {
            switch (currentEventType) {
              case EventTypes.PERSONAL:
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
              case EventTypes.COMPANY:
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
                return '';
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

        <span className="tk_EventForm_Delimiter"/>

        <Form.Item initialValue={isMultiDay} label="Duration:" name="duration" rules={[{required: true}]}>
          <Radio.Group onChange={onChangeMultiDay} className="tk_EventType_RadioGroup">
            <Row>
              <Col span={12}>
                <Radio.Button value={false} className="tk_EventType_RadioButton" style={{height: 40, paddingTop:12}}>
                  <div>
                    <p>One day</p>
                  </div>
                </Radio.Button>
              </Col>
              <Col span={12}>
                <Radio.Button value={true} className="tk_EventType_RadioButton" style={{height: 40, paddingTop:12}}>
                  <div>
                    <p>Multiple days</p>
                  </div>
                </Radio.Button>
              </Col>
            </Row>
          </Radio.Group>
        </Form.Item>

        <span className="tk_EventForm_Delimiter"/>


        {renderDatePickers(onStartDateChange, onStartHoursChange, onEndDateChange, onEndHoursChange)}

        <span className="tk_EventForm_Delimiter"/>

        {renderEventDurationComponent()}

      </Col>);
  };

  const renderEventDurationComponent = () => {
    if(!isMultiDay && !_.isNull(startDate)) {
      return <EventDuration
        startDate={moment(startDate).utc(true)}
        startDateHours={startDateHours}
        endDate={moment(startDate).utc(true)}
        endDateHours={0}
        locale={'FR'}/>;
    } else if (isMultiDay && !_.isNull(startDate) && !_.isNull(endDate) && endDateHours > 0) {
      // only show duration if the event type is COMPANY, or
      // if the start and end hours values are all included in EventHoursRadioGroupValues
      if(_.isEqual(currentEventType, EventTypes.COMPANY)
          || (_.includes(EventHoursRadioGroupValues, startDateHours) && _.includes(EventHoursRadioGroupValues, endDateHours))) {
        return <EventDuration
          startDate={moment(startDate).utc(true)}
          startDateHours={startDateHours}
          endDate={moment(endDate).utc(true)}
          endDateHours={endDateHours}
          locale={'FR'}/>;
      } else {
        return <div/>;
      }
    } else {
      return <div/>;
    }
  };

  const onStartDateChange = (value) => setStartDate(moment(value).startOf('day'));
  const onStartHoursChange = (value) => setStartDateHours(value);
  const onEndDateChange = (value) => setEndDate(moment(value).startOf('day'));
  const onEndHoursChange = (value) => setEndDateHours(value);
  const onChangeMultiDay = (value) => setIsMultiDay(value.target.value);
  const onStartRadioHoursChange = (value) => setStartDateHours(value.target.value);
  const onEndRadioHoursChange = (value) => setEndDateHours(value.target.value);

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
    if(value.target.value === 'myself') {
      setUsersSelected([]);
    }
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
        <Radio.Group onChange={onChangeUserRadioButton} className="tk_UserEvent_Radio_Button">
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