/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
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
  Alert,
  AlertActionLink,
  AlertVariant,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import React, { ErrorInfo, PropsWithChildren } from 'react';
import Pluralize from 'react-pluralize';

import { DisposableCollection } from '@/services/helpers/disposable';

export const STORAGE_KEY_RELOAD_NUMBER = 'UD:ErrorBoundary:reloaded';
const RELOAD_TIMEOUT_SEC = 30;
const RELOADS_FOR_EXTENDED_MESSAGE = 2;

type Props = PropsWithChildren & {
  onError: (error?: string) => void;
};
type State = {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  expanded: boolean;
  activeItems: any;
  shouldReload: boolean;
  reloadAfter: number;
  reloadedTimes: number;
  countdownStopped: boolean;
};

export class ErrorBoundary extends React.PureComponent<Props, State> {
  private readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    const reloadedTimes = parseInt(sessionStorage.getItem(STORAGE_KEY_RELOAD_NUMBER) || '0', 10);

    this.state = {
      hasError: false,
      expanded: false,
      activeItems: {},
      shouldReload: false,
      reloadAfter: RELOAD_TIMEOUT_SEC,
      reloadedTimes,
      countdownStopped: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });

    if (this.testResourceNotFound(error)) {
      this.props.onError(error.message);
      this.setState({
        shouldReload: true,
      });
      this.startCountdown();
    }
  }

  public componentDidMount(): void {
    window.onbeforeunload = () => {
      if (this.state.shouldReload === false) {
        this.clearReloadCounter();
      } else {
        this.increaseReloadCounter();
      }
    };
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private testResourceNotFound(error: Error): boolean {
    return /loading chunk [\d]+ failed/i.test(error.message);
  }

  private handleToggleViewStack() {
    const expanded = !this.state.expanded;
    this.setState({
      expanded,
    });
  }

  private handleReloadNow(): void {
    window.location.reload();
  }

  private clearReloadCounter() {
    sessionStorage.removeItem(STORAGE_KEY_RELOAD_NUMBER);
  }

  private increaseReloadCounter() {
    const reloadedTimes = this.state.reloadedTimes + 1;
    sessionStorage.setItem(STORAGE_KEY_RELOAD_NUMBER, reloadedTimes.toString());
  }

  private handleStopCountdown(): void {
    this.setState({
      countdownStopped: true,
    });
    this.toDispose.dispose();
  }

  private startCountdown(): void {
    const id = window.setInterval(() => {
      const reloadAfter = this.state.reloadAfter - 1;
      this.setState({
        reloadAfter,
      });
      if (reloadAfter === 0) {
        this.handleReloadNow();
      }
    }, 1000);

    this.toDispose.push({
      dispose: () => window.clearInterval(id),
    });
  }

  private buildErrorMessageAlert(): React.ReactElement {
    const { error, errorInfo, expanded } = this.state;

    const actionErrorTitle = expanded ? 'Hide stack' : 'View stack';
    const errorName = error?.name ? error.name : Error;
    const errorMessage = error?.message ? ': ' + error.message : '';

    return (
      <Alert
        isInline
        variant={AlertVariant.danger}
        title={errorName + errorMessage}
        actionLinks={
          <AlertActionLink onClick={() => this.handleToggleViewStack()}>
            {actionErrorTitle}
          </AlertActionLink>
        }
      >
        {expanded && errorInfo && (
          <TextContent>
            <Text component={TextVariants.pre}>{errorInfo.componentStack}</Text>
          </TextContent>
        )}
      </Alert>
    );
  }

  private buildReloadAlert(): React.ReactNode {
    const { reloadAfter, shouldReload, reloadedTimes, countdownStopped } = this.state;

    if (shouldReload === false) {
      return;
    }

    const secondsRemain = <Pluralize singular={'second'} count={reloadAfter} />;

    let title = <>The application has been likely updated on the server.</>;
    if (countdownStopped === false) {
      title = (
        <>
          {title} Refreshing a page to get newer resources in {secondsRemain}.
        </>
      );
    }

    let message: React.ReactNode | undefined;
    if (reloadedTimes >= RELOADS_FOR_EXTENDED_MESSAGE) {
      message = <>Contact an administrator if refreshing continues after the next load.</>;
    }

    return (
      <Alert
        isInline
        variant={AlertVariant.warning}
        title={title}
        actionLinks={
          <React.Fragment>
            <AlertActionLink onClick={() => this.handleReloadNow()}>Reload now</AlertActionLink>
            {countdownStopped === false && (
              <AlertActionLink onClick={() => this.handleStopCountdown()}>
                Stop countdown
              </AlertActionLink>
            )}
          </React.Fragment>
        }
      >
        {message}
      </Alert>
    );
  }

  render(): React.ReactNode {
    const { hasError } = this.state;

    if (!hasError) {
      return this.props.children;
    }

    const errorMessageAlert = this.buildErrorMessageAlert();
    const reloadAlert = this.buildReloadAlert();

    return (
      <PageSection variant={PageSectionVariants.light} isFilled={true}>
        {reloadAlert}
        {errorMessageAlert}
      </PageSection>
    );
  }
}
