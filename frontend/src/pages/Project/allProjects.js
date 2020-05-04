import React from 'react';
import MainPage from '../MainPage/MainPage';
import ProjectList from '../../components/Projects/ProjectList';

const ProjectsPage = () => {
  return (
    <MainPage title={'List of projects'}>
      <ProjectList/>
    </MainPage>
  );
};
export default ProjectsPage;