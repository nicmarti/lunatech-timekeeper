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

package fr.lunatech.timekeeper.services;

import fr.lunatech.timekeeper.models.Project;
import fr.lunatech.timekeeper.models.ProjectUser;
import fr.lunatech.timekeeper.models.User;
import fr.lunatech.timekeeper.resources.exceptions.ConflictOnVersionException;
import fr.lunatech.timekeeper.resources.exceptions.CreateResourceException;
import fr.lunatech.timekeeper.services.requests.ProjectRequest;
import fr.lunatech.timekeeper.services.requests.TimeSheetRequest;
import fr.lunatech.timekeeper.services.responses.ProjectResponse;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import io.quarkus.security.ForbiddenException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.persistence.PersistenceException;
import javax.transaction.Transactional;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static javax.transaction.Transactional.TxType.MANDATORY;

@ApplicationScoped
public class ProjectService {
    private static final Logger logger = LoggerFactory.getLogger(ProjectService.class);

    @Inject
    ClientService clientService;

    @Inject
    UserService userService;

    @Inject
    TimeSheetService timeSheetService;

    public Optional<ProjectResponse> findResponseById(Long id, Optional<Boolean> optimized, AuthenticationContext ctx) {
        return findById(id, ctx).map(project -> ProjectResponse.bind(project, optimized));
    }

    public List<ProjectResponse> listAllResponses(AuthenticationContext ctx) {
        return streamAll(ctx, ProjectResponse::bind, Collectors.toList());
    }

    @Transactional
    public Long create(ProjectRequest request, AuthenticationContext ctx) {
        logger.debug("Create a new project with {}, {}", request, ctx);
        final Project project = request.unbind(clientService::findById, userService::findById, ctx);
        try {
            project.persistAndFlush();
        } catch (PersistenceException pe) {
            throw new CreateResourceException("Project was not created due to constraint violation");
        }
        project.users
                .forEach(projectUser -> timeSheetService.createDefaultTimeSheet(project, projectUser.user, ctx));
        return project.id;
    }

    // docs : https://quarkus.io/guides/transaction
    @Transactional(MANDATORY)
    private void deleteOldMembers(Project project, Predicate<ProjectUser> deleteUserPredicate, List<Long> userTimeSheetsToUpdate, AuthenticationContext userContext) {
        project.users.stream()
            .filter(deleteUserPredicate)
            .map(user -> {
                timeSheetService.findFirstForProjectForUser(project.id, user.user.id)
                    .ifPresent(tsResp -> {
                        if(userTimeSheetsToUpdate.contains(user.user.id)) {
                            final TimeSheetRequest tsReq = new TimeSheetRequest(tsResp.timeUnit,
                                tsResp.defaultIsBillable,
                                LocalDate.now(),
                                tsResp.maxDuration,
                                tsResp.timeUnit,
                                tsResp.startDate);
                            timeSheetService.update(tsResp.id, tsReq, userContext);
                        }
                    });
                return user;
            })
            .forEach(PanacheEntityBase::delete);
    }

    @Transactional(MANDATORY)
    private void createTimeSheetsForNewUsers(Project project, AuthenticationContext userContext) {
        // Create the timesheets for the new members
        project.users
                .stream()
                .filter(projectUser -> timeSheetService.userHasNoTimeSheet(project.id, projectUser.user.id))
                .forEach(projectUser -> timeSheetService.createDefaultTimeSheet(project, projectUser.user, userContext));
    }

    @Transactional
    public Optional<Long> update(Long id, ProjectRequest request, AuthenticationContext ctx) {
        logger.debug("Modify project for for id={} with {}, {}", id, request, ctx);
        final var maybeProject = findById(id, ctx);
        if (maybeProject.isEmpty()) {
            return Optional.empty();
        }
        final Project project = maybeProject.get();
        if (!ctx.canEdit(project)) {
            throw new ForbiddenException("The user can't edit this project with id : " + project.id);
        }

        if (!project.version.equals(request.getVersion())) {
            throw new ConflictOnVersionException(String.format("Version of this project does not match the current project version (%d) ", project.version));
        }

        final List<Long> userIds = request.getUsers().stream().map(ProjectRequest.ProjectUserRequest::getId).collect(Collectors.toList());

        final List<Long> userIdToDelete = project.users.stream()
                .map(i -> i.user.id)
                .filter(i -> !userIds.contains(i))
                .collect(Collectors.toList());

        // It has to be done before the project is unbind
        deleteOldMembers(project, request::notContains, userIdToDelete, ctx);

        final Project updatedProject = request.unbind(maybeProject.get(), clientService::findById, userService::findById, ctx);

        // This code is for Quarkus Issue https://github.com/quarkusio/quarkus/issues/7193
        updatedProject.persistAndFlush();

        createTimeSheetsForNewUsers(updatedProject, ctx);
        return Optional.of(project.id);
    }



    @Transactional
    public Optional<Long> joinProject(Long id, AuthenticationContext userContext) {
        logger.debug("Modify project for for id={} with userId={}, {}", id, userContext.getUserId(), userContext);
        final Optional<Project> maybeProject = findById(id, userContext);
        maybeProject.ifPresent(project -> {
            if (!userContext.canJoin(project)) {
                throw new ForbiddenException("The user can't join the project with id : " + project.id);
            }
        });
        final Optional<User> maybeUser = userService.findById(userContext.getUserId(), userContext);
        if (maybeUser.isEmpty() || maybeProject.isEmpty()) {
            return Optional.empty();
        }
        final Project project = maybeProject.get();
        final User user = maybeUser.get();
        ProjectUser projectUser = new ProjectUser();
        projectUser.project = project;
        projectUser.manager = false;
        projectUser.user = user;
        project.users.add(projectUser);
        createTimeSheetsForNewUsers(project, userContext);
        return Optional.of(project.id);
    }

    Optional<Project> findById(Long id, AuthenticationContext ctx) {
        return Project.<Project>findByIdOptional(id)
                .filter(ctx::canAccess);
    }

    <R extends Collection<ProjectResponse>> R streamAll(
            AuthenticationContext ctx,
            Function<Project, ProjectResponse> bind,
            Collector<ProjectResponse, ?, R> collector
    ) {
        try (final Stream<Project> projects = Project.streamAll()) {
            return projects
                    .filter(ctx::canAccess)
                    .map(bind)
                    .collect(collector);
        }
    }
}
