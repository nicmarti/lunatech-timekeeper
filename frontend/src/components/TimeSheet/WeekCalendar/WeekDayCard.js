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

import React from 'react';
import PropTypes from 'prop-types';

import './WeekCalendar.less';
import './CardWeekCalendar.less';
import moment from 'moment';
import DisplayTopRightCorner from '../MonthCalendar/DisplayTopRightCorner';
import TimeEntriesForADay from './TimeEntriesForADay';
import UserEventsForADay from './UserEventsForADay';

const WeekDayCard = (props) => {
  const {
    onClickCard,
    onClickButton,
    onClickEntryCard,
    dateAsMoment,
    timeEntries,
    eventEntries,
    isItPublicHoliday,
    hoursCompleted,
    isDayDisabled,
    isDayWithoutAnyEntries
  } = props;

  const applyClassForTodayDate = moment().isSame(timeEntries.date, 'day') ? 'tk_CurrentDay' : '';
  const applyClassForEntries = (isDayWithoutAnyEntries && !isDayDisabled) ? 'tk_CardWeekCalendar_Body tk_CardWeekCalendar_Body_With_Warn' : 'tk_CardWeekCalendar_Body';

  return (
    <div className="tk_WeekCalendar_Day" key={`WeekCalendarDay-${timeEntries.date.toString()}`}>
      <p>{timeEntries.date.format('ddd')}</p>
      <div className="tk_CardWeekCalendar">
        <div className="tk_CardWeekCalendar_Head">
          <p className={applyClassForTodayDate}>{timeEntries.date.format('Do')}</p>
          <DisplayTopRightCorner
            isPublicHoliday={isItPublicHoliday}
            hoursCompleted={hoursCompleted}
            dateAsMoment={timeEntries.date}
            onClickPlusButton={onClickButton}
            isDisabled={isDayDisabled}
          />
        </div>
        <div className={applyClassForEntries}
          disabled={isDayDisabled}
          onClick={(e) => onClickCard && onClickCard(e, dateAsMoment)}
        >
          <UserEventsForADay eventEntries={eventEntries}/>
          <TimeEntriesForADay
            timeEntries={timeEntries}
            onClickEntryCard={onClickEntryCard}
          />
        </div>
      </div>
    </div>
  );
};

WeekDayCard.propTypes = {
  onClickCard: PropTypes.func.isRequired,
  onClickButton: PropTypes.func.isRequired,
  onClickEntryCard: PropTypes.func.isRequired,
  dateAsMoment: PropTypes.instanceOf(moment).isRequired,
  timeEntries: PropTypes.object.isRequired,
  eventEntries:PropTypes.arrayOf(PropTypes.object),
  isItPublicHoliday:PropTypes.bool.isRequired,
  hoursCompleted: PropTypes.bool.isRequired,
  isDayDisabled:PropTypes.bool.isRequired,
  isDayWithoutAnyEntries:PropTypes.bool.isRequired,
};


export default WeekDayCard;
