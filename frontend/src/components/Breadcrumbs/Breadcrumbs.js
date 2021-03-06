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
import {Link, withRouter} from 'react-router-dom';
import {Breadcrumb} from 'antd';
import PropTypes from 'prop-types';

const breadcrumbNameMap = {
  '/clients': 'Clients',
  '/clients/new': 'New client',
  '/users': 'Users',
  '/projects': 'Projects',
  '/projects/new': 'New project',
  '/time_entries': 'Time entries',
  '/events': 'Events',
  '/events/new': 'New event'
};

// The dynamic breadcrumb must be used for an exact pathname only.
// To use the regex, the ids must be matched with (\\d+)
// The regex must be simple
const breadcrumbDynamicMap = {
  '/projects/(\\d+)/edit': (name) => `Edit project ${name}`,
  '/projects/(\\d+)': (name) => name || 'Project details',
  '/clients/(\\d+)/edit': (name) => `Edit client ${name}`,
  '/events/(\\d+)/edit': (name) => `Edit event ${name}`,
};

const Breadcrumbs = ({location, entityName}) => {

  // URL without ids
  const pathSnippets = location.pathname.split('/').filter(i => i);
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const token = pathSnippets.slice(0, index + 1);
    const url = `/${token.join('/')}`;
    const breadcrumbName = breadcrumbNameMap[url];
    if (breadcrumbName !== undefined) {
      return (
        <Breadcrumb.Item key={url}>
          <Link to={url}>{breadcrumbNameMap[url] ? breadcrumbNameMap[url] : 'Page'}</Link>
        </Breadcrumb.Item>
      );
    } else {
      return '';
    }
  });

  // Exact pathname only, it is usually for the last link
  const {pathname} = location;
  const match = Object.keys(breadcrumbDynamicMap).map(key => {
    const regex = new RegExp(key);
    const match = pathname.match(regex);
    return (match && pathname === match[0]) ? key : undefined;
  }).filter(i => i);

  const computeDynamicBreadcrumb = () => {
    if (match.length !== 0) {
      const key = match.pop();
      const f = breadcrumbDynamicMap[key];
      return (
        <Breadcrumb.Item key={pathname}>
          <Link to={pathname}>{f ? f(entityName || '') : 'Page'}</Link>
        </Breadcrumb.Item>
      );
    } else {
      return '';
    }
  };
  const extraBreadcrumbItemDynamic = computeDynamicBreadcrumb();

  const breadcrumbItems = [
    <Breadcrumb.Item key="home">
      <Link to="/">Home</Link>
    </Breadcrumb.Item>,
  ].concat(extraBreadcrumbItems).concat(extraBreadcrumbItemDynamic);

  return (<Breadcrumb>{breadcrumbItems}</Breadcrumb>);
};


Breadcrumbs.propTypes = {
  location: PropTypes.object.isRequired,
  entityName: PropTypes.string
};


export default withRouter(Breadcrumbs);