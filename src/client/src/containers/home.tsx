import React from 'react';
import LayoutTemplate from '../components/layout/layout';


export default () => {
  const containerStyle = {
    color: '#777',
    display: 'flex',
    height: '100vh',
    paddingTop: '200px',
    alignItems: 'center',
    flexDirection: 'column' as 'column'
  };

  const searchStyle = {
    width: '60%'
  };

  return (
    <LayoutTemplate>
        <div className='container' style={containerStyle}>
          <div className='is-size-3'>Versity Search</div>

          <div className='field search' style={searchStyle}>
            <p className='control has-icons-right'>
              <input
                name='q'
                type='text'
                className='input is-medium'
                placeholder='Search for papers by programme, level, course code and title'
                />
              <span className='icon is-small is-right'>
                <i className='fas fa-check'></i>
              </span>
            </p>
          </div>
        </div>
    </LayoutTemplate>
  );
};
