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

package fr.lunatech.timekeeper.resources;

import fr.lunatech.timekeeper.resources.openapi.UserAvailabilityResourceApi;
import fr.lunatech.timekeeper.resources.providers.AuthenticationContextProvider;
import fr.lunatech.timekeeper.services.UserEventService;
import fr.lunatech.timekeeper.services.UserService;
import fr.lunatech.timekeeper.services.responses.Attendee;
import fr.lunatech.timekeeper.services.responses.AvailabilityResponse;
import fr.lunatech.timekeeper.services.responses.UserEventResponse;
import fr.lunatech.timekeeper.services.responses.UserResponse;
import fr.lunatech.timekeeper.timeutils.TimeKeeperDateUtils;
import org.eclipse.microprofile.metrics.MetricUnits;
import org.eclipse.microprofile.metrics.annotation.Counted;
import org.eclipse.microprofile.metrics.annotation.Timed;
import org.joda.time.DateTime;
import org.joda.time.Interval;

import javax.annotation.security.RolesAllowed;
import javax.inject.Inject;
import javax.ws.rs.NotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class UserAvailabilityResource implements UserAvailabilityResourceApi {
    @Inject
    UserService userService;

    @Inject
    UserEventService userEventService;

    @Inject
    AuthenticationContextProvider authentication;

    @RolesAllowed({"user", "admin"})
    @Override
    @Counted(name = "countGetAvailabilities", description = "Counts how many times the user to get the organization on method 'getAvailabilities'")
    @Timed(name = "timeGetAvailabilities", description = "Times how long it takes the user to get the organization on method 'getAvailabilities'", unit = MetricUnits.MILLISECONDS)
    public AvailabilityResponse getAvailabilities(String startDateTime, String endDateTime) {
        try {
            final LocalDateTime startLocalDateTime = LocalDateTime.parse(startDateTime);
            final LocalDateTime endLocalDateTime = LocalDateTime.parse(endDateTime);
            final LocalDate startDate = startLocalDateTime.toLocalDate();
            final LocalDate endDate = endLocalDateTime.toLocalDate();

            //Let's get all the users
            List<UserResponse> availableUserResponses = userService.listAllResponses(authentication.context());
            List<UserResponse> unavailableUserResponses = List.copyOf(availableUserResponses);

            //Let's get all the user events in the system
            List<UserEventResponse> listAllUserEvents = userEventService.listAllEventUser(authentication.context());

            if (startDate.isEqual(endDate)) {
                //When start and end are the same day
                filterAvailabilityForDay(startDate, startLocalDateTime, endLocalDateTime, availableUserResponses, listAllUserEvents);
            } else if(startDate.plusDays(1).isEqual(endDate)) {
                //When end is the day after start
                //remove any unavailable at the start
                filterAvailabilityForDay(startDate
                        , startLocalDateTime
                        , LocalDateTime.of(startDate, TimeKeeperDateUtils.END_OF_DAY)
                        , availableUserResponses
                        , listAllUserEvents
                );
                //remove any unavailable at the end
                filterAvailabilityForDay(endDate
                        , LocalDateTime.of(endDate, TimeKeeperDateUtils.START_OF_DAY)
                        , endLocalDateTime
                        , availableUserResponses
                        , listAllUserEvents
                );
            } else {
                //When start and end has days in between
                //Remove from 'available' if a user already has an event between the start and end dates
                final Interval queryInterval = new Interval(
                        DateTime.parse(startDateTime).plusDays(1) //Don't include the start date - we handle that later
                                .withHourOfDay(TimeKeeperDateUtils.START_OF_DAY.getHour())
                                .withMinuteOfHour(TimeKeeperDateUtils.START_OF_DAY.getMinute())
                                .withSecondOfMinute(TimeKeeperDateUtils.START_OF_DAY.getSecond())
                        , DateTime.parse(endDateTime).minusDays(1) //Don't include the end date - we handle that later
                                .withHourOfDay(TimeKeeperDateUtils.END_OF_DAY.getHour())
                                .withMinuteOfHour(TimeKeeperDateUtils.END_OF_DAY.getMinute())
                                .withSecondOfMinute(TimeKeeperDateUtils.END_OF_DAY.getSecond())
                );
                final var unavailableUserIds = listAllUserEvents
                        .stream()
                        .filter(event -> {
                            final Interval eventInterval = new Interval(DateTime.parse(event.getStartDateTime()), DateTime.parse(event.getEndDateTime()));
                            return queryInterval.overlaps(eventInterval);
                        })
                        .map(event -> event
                                .getAttendees()
                                .stream()
                                .map(Attendee::getUserId)
                                .collect(Collectors.toList())
                        )
                        .flatMap(Collection::stream)
                        .distinct()
                        .collect(Collectors.toList());

                final var unavailable = availableUserResponses
                        .stream()
                        .filter(user -> unavailableUserIds.contains(user.getId()))
                        .collect(Collectors.toList());
                availableUserResponses.removeAll(unavailable);

                //remove any unavailable at the start
                filterAvailabilityForDay(startDate
                        , startLocalDateTime
                        , LocalDateTime.of(startDate, TimeKeeperDateUtils.END_OF_DAY)
                        , availableUserResponses
                        , listAllUserEvents
                );
                //remove any unavailable at the end
                filterAvailabilityForDay(endDate
                        , LocalDateTime.of(endDate, TimeKeeperDateUtils.START_OF_DAY)
                        , endLocalDateTime
                        , availableUserResponses
                        , listAllUserEvents
                );

            }

            return new AvailabilityResponse(
                    startLocalDateTime
                    , endLocalDateTime
                    , availableUserResponses
                    , unavailableUserResponses
                        .stream()
                        .filter(user -> availableUserResponses.contains(user) == false)
                        .collect(Collectors.toList())
            );
        } catch (Exception e) {
            throw new NotFoundException();
        }
    }

    private void filterAvailabilityForDay(LocalDate referenceDate, LocalDateTime startLocalDateTime, LocalDateTime endLocalDateTime, List<UserResponse> listAllResponses, List<UserEventResponse> listAllUserEvents) {
        final var hours = TimeKeeperDateUtils.computeTotalNumberOfHours(startLocalDateTime, endLocalDateTime);
        final Interval queryInterval = new Interval(
                DateTime.parse(referenceDate.toString())
                        .withHourOfDay(TimeKeeperDateUtils.START_OF_DAY.getHour())
                        .withMinuteOfHour(TimeKeeperDateUtils.START_OF_DAY.getMinute())
                        .withSecondOfMinute(TimeKeeperDateUtils.START_OF_DAY.getSecond()),
                DateTime.parse(referenceDate.toString())
                        .withHourOfDay(TimeKeeperDateUtils.END_OF_DAY.getHour())
                        .withMinuteOfHour(TimeKeeperDateUtils.END_OF_DAY.getMinute())
                        .withSecondOfMinute(TimeKeeperDateUtils.END_OF_DAY.getSecond())
        );
        final var eventsOnDay = listAllUserEvents
                .stream()
                .filter(event -> {
                    final Interval eventInterval = new Interval(DateTime.parse(event.getStartDateTime()), DateTime.parse(event.getEndDateTime()));
                    return queryInterval.overlaps(eventInterval);
                })
                .collect(Collectors.groupingBy(e ->
                                e.getAttendees().get(0).getUserId(), Collectors.summingInt(e ->
                                TimeKeeperDateUtils.computeHoursOnDay(referenceDate
                                        , LocalDateTime.parse(e.getStartDateTime())
                                        , LocalDateTime.parse(e.getEndDateTime())
                                ).intValue()
                        )
                ));

        final var maxHoursInDay = TimeKeeperDateUtils.getMaxHoursInDay();
        final var unavailable = listAllResponses
                .stream()
                .filter(user -> {
                    if (eventsOnDay.containsKey(user.getId()))
                        return hours + eventsOnDay.getOrDefault(user.getId(), maxHoursInDay) > maxHoursInDay;
                    else
                        return false;
                })
                .collect(Collectors.toList());

        listAllResponses.removeAll(unavailable);
    }
}
