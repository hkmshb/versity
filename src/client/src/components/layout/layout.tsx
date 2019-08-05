import React, { Component } from 'react';


interface ILayoutTemplateProps {
  children: React.ReactNode | React.ReactNode[];
}

const LayoutTemplate = (props: ILayoutTemplateProps) => {
  return (
    <React.Fragment>
      {props.children}
    </React.Fragment>
  );
};

export default LayoutTemplate;
