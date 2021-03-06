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
import { BrowserRouter as Router, Redirect, Switch, Route } from 'react-router-dom';

import { useKeycloak } from '@react-keycloak/web';

import HomePage from '../pages/Home/index';
import LoginPage from '../pages/Login/index';
import ClientsPage from '../pages/Client/allClients.js';
import NewClientPage from '../pages/Client/newClient.js';
import EditClientPage from '../pages/Client/editClient.js';

import { PrivateRoute } from './utils';
import UsersPage from '../pages/User/allUsers';
import ProjectsPage from '../pages/Project/allProjects';
import NewProjectPage from '../pages/Project/newProject';
import DetailProjectPage from '../pages/Project/detailProject';
import EditProjectsPage from '../pages/Project/editProject';
import TimeEntriesPage from '../pages/TimeSheet/TimeEntriesPage';
import EventsPage from '../pages/Event/eventsPage';
import NewEventTemplatePage from '../pages/Event/NewEventTemplatePage';
import EditEventTemplatePage from '../pages/Event/EditEventTemplatePage';

export const AppRouter = () => {
  const [, initialized] = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Switch>
        <Route        path="/login"        component={LoginPage} />
        <PrivateRoute exact path="/home"   component={HomePage} />
        <PrivateRoute path="/users"        component={UsersPage} roles={['admin']} />
        <PrivateRoute path="/projects/new" component={NewProjectPage} roles={['admin']} />
        <PrivateRoute path="/projects/:id/edit" component={EditProjectsPage} />
        <PrivateRoute path="/projects/:id" component={DetailProjectPage} />
        <PrivateRoute path="/projects"     component={ProjectsPage} />
        <PrivateRoute path="/clients/new"  component={NewClientPage} roles={['admin']} />
        <PrivateRoute path="/clients/:id/edit"  component={EditClientPage} roles={['admin']} />
        <PrivateRoute path="/clients"      component={ClientsPage} roles={['admin']} />
        <PrivateRoute path="/time_entries" component={TimeEntriesPage} />
        <PrivateRoute path="/events/:id/edit"  component={EditEventTemplatePage} roles={['admin']} />
        <PrivateRoute path="/events/new"       component={NewEventTemplatePage} roles={['admin']}/>
        <PrivateRoute path="/events"       component={EventsPage} />

        {/*the /clients route must be after any other clients routes, else it does not work*/}
        <Redirect from="/" to="/home" />
      </Switch>
    </Router>
  );
};
