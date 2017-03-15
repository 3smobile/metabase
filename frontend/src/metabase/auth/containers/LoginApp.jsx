import React, { Component, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import { Link } from "react-router";
import { connect } from "react-redux";

import cx from "classnames";

import AuthScene from "../components/AuthScene.jsx";
import SSOLoginButton from "../components/SSOLoginButton.jsx";
import FormField from "metabase/components/form/FormField.jsx";
import FormLabel from "metabase/components/form/FormLabel.jsx";
import FormMessage from "metabase/components/form/FormMessage.jsx";
import LogoIcon from "metabase/components/LogoIcon.jsx";
import Settings from "metabase/lib/settings.js";


import * as authActions from "../auth";


const mapStateToProps = (state, props) => {
    return {
        loginError:       state.auth && state.auth.loginError,
        user:             state.currentUser
    }
}

const mapDispatchToProps = {
    ...authActions
}

@connect(mapStateToProps, mapDispatchToProps)
export default class LoginApp extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            credentials: {},
            valid: false
        }
    }

    validateForm() {
        let { credentials } = this.state;

        let valid = true;

        if (!credentials.email || !credentials.password) {
            valid = false;
        }

        if (this.state.valid !== valid) {
            this.setState({ valid });
        }
    }

    componentDidMount() {

        this.validateForm();

        const { loginGoogle, location } = this.props;

        let ssoLoginButton = findDOMNode(this.refs.ssoLoginButton);

        function attachGoogleAuth() {
            // if gapi isn't loaded yet then wait 100ms and check again. Keep doing this until we're ready
            if (!window.gapi) {
                window.setTimeout(attachGoogleAuth, 100);
                return;
            }
            try {
                window.gapi.load('auth2', () => {
                  let auth2 = window.gapi.auth2.init({
                      client_id: Settings.get('google_auth_client_id'),
                      cookiepolicy: 'single_host_origin',
                  });
                  auth2.attachClickHandler(ssoLoginButton, {},
                      (googleUser) => loginGoogle(googleUser, location.query.redirect),
                      (error) => console.error('There was an error logging in', error)
                  );
                })
            } catch (error) {
                console.error('Error attaching Google Auth handler: ', error);
            }
        }
        attachGoogleAuth();
    }

    componentDidUpdate() {
        this.validateForm();
    }

    onChange(fieldName, fieldValue) {
        this.setState({ credentials: { ...this.state.credentials, [fieldName]: fieldValue }});
    }

    formSubmitted(e) {
        e.preventDefault();

        let { login, location } = this.props;
        let { credentials } = this.state;

        login(credentials, location.query.redirect);
    }

    render() {

        const { loginError } = this.props;

        return (
            <div className="full-height full bg-white flex flex-column flex-full md-layout-centered">
                <div className="Login-wrapper wrapper Grid Grid--full md-Grid--1of2 relative z2">
                    <div className="Grid-cell flex layout-centered text-brand">
                        <LogoIcon className="Logo my4 sm-my0" width={66} height={85} />
                    </div>
                    <div className="Login-content Grid-cell">
                        <form className="Form-new bg-white bordered rounded shadowed" name="form" onSubmit={(e) => this.formSubmitted(e)} noValidate>
                            <h3 className="Login-header Form-offset">Sign in to QuickTrials Reports</h3>

                            { Settings.ssoEnabled() &&
                                <div className="mx4 mb4 py3 border-bottom relative">
                                    <SSOLoginButton provider='google' ref="ssoLoginButton"/>
                                    {/*<div className="g-signin2 ml1 relative z2" id="g-signin2"></div>*/}
                                </div>
                            }
                        </form>
                    </div>
                </div>
                <AuthScene />
            </div>
        );
    }
}
