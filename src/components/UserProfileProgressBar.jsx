/* eslint-disable react/prop-types */
import React from 'react';
import injectStyle from './injectStyle';

const UserProfileProgressBar = (props) => {
  const { completed, currentxp } = props;

  const keyframesStyle = `
  @-webkit-keyframes grow {
    0%   { opacity: 0; width: 0px }
    10%  { opacity: 0 }
    50%  { opacity: 1 }
    100% { width: ${completed}% }
`;
  injectStyle(keyframesStyle);

  const containerStyles = {
    height: 30,
    width: '65vw',
    backgroundColor: '#fff',
    borderRadius: 50,
    boxShadow: '1px 1px 2px grey inset',
  };

  const fillerStyles = {
    height: '100%',
    width: `${completed}%`,
    backgroundColor: '#32cd32',
    borderRadius: 'inherit',
    textAlign: 'right',
    boxShadow: '1px 1px 2px grey inset',
    animation: 'grow 1s ease-in-out',
  };

  const labelStyles = {
    padding: 5,
    color: 'white',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyles}>
      <div style={fillerStyles} className="progressBar">
        <span style={labelStyles}>{`${currentxp}xp`}</span>
      </div>
    </div>
  );
};

export default UserProfileProgressBar;
