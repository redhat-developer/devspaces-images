/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import {
  Form,
  FormGroup,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Text,
  TextInput,
  TextVariants,
  Title,
} from '@patternfly/react-core';
import { History } from 'history';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import Head from '../../components/Head';
import { AppState } from '../../store';
import { selectBranding } from '../../store/Branding/selectors';
import { selectUserProfile } from '../../store/UserProfile/selectors';

type Props = {
  history: History;
} & MappedProps;

export class UserAccount extends React.PureComponent<Props> {
  render(): React.ReactNode {
    const productName = this.props.branding.name;
    const { userProfile } = this.props;

    return (
      <React.Fragment>
        <Head pageName="User Account" />
        <PageSection variant={PageSectionVariants.light} isFilled={true}>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h1">Account</Title>
              <Text component={TextVariants.p}>
                {`This is where you can view and edit your account information for ${productName}.`}
              </Text>
            </StackItem>
            <StackItem isFilled>
              <Form isWidthLimited>
                <FormGroup label="Login" fieldId="form-group-login">
                  <TextInput aria-label="readonly login" value={userProfile.username} isDisabled />
                </FormGroup>
                <FormGroup label="Email" fieldId="form-group-email">
                  <TextInput aria-label="readonly email" value={userProfile.email} isDisabled />
                </FormGroup>
              </Form>
            </StackItem>
          </Stack>
        </PageSection>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  userProfile: selectUserProfile(state),
  branding: selectBranding(state),
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(UserAccount);
