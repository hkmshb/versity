import React, { Component } from "react";


interface HomeProps {}
interface HomeState {}

class HomePage extends Component<HomeProps, HomeState> {
  render() {
    return (
      <React.Fragment>
        <style jsx>{`
          .container {
            color: #777;
            display: flex;
            height: 100vh;
            padding-top: 200px;
            align-items: center;
            flex-direction: column;
          }

          .field.search {
            width: 60%;
          }
        `}</style>

        <div className="container">
          <div className="is-size-3">Versity Search</div>

          <div className="field search">
            <p className="control has-icons-right">
              <input
                name="q"
                type="text"
                className="input is-medium"
                placeholder="Search for papers by programme, level, course code and title"
                />
              <span className="icon is-small is-right">
                <i className="fas fa-check"></i>
              </span>
            </p>
          </div>
        </div>
      </React.Fragment>
    );
  }f
}

export default HomePage;
