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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import renderer from 'react-test-renderer';

import { ErrorBoundary, STORAGE_KEY_RELOAD_NUMBER } from '..';

class GoodComponent extends React.Component {
  render() {
    return <span>component</span>;
  }
}
class BadComponent extends React.Component {
  render() {
    throw new Error('Uncaught exception');
    return <span>component</span>;
  }
}
export class NoResourceComponent extends React.Component {
  render() {
    throw new Error('Loading chunk 23 failed.');
    return <span>component</span>;
  }
}

// mute the outputs
console.error = jest.fn();

const mockOnError = jest.fn();
function wrapComponent(componentToWrap: React.ReactNode) {
  return <ErrorBoundary onError={mockOnError}>{componentToWrap}</ErrorBoundary>;
}

describe('Error boundary', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render a correctly working component', () => {
    const goodComponent = <GoodComponent />;
    const errorBoundary = wrapComponent(goodComponent);
    expect(renderer.create(errorBoundary).toJSON()).toMatchSnapshot();
  });

  it('should catch an error thrown inside a component', () => {
    const badComponent = <BadComponent />;
    const errorBoundary = wrapComponent(badComponent);
    expect(renderer.create(errorBoundary).toJSON()).toMatchSnapshot();
  });

  describe('error details', () => {
    it('should show and hide the error stack', () => {
      const errorBoundary = wrapComponent(<BadComponent />);
      render(errorBoundary);

      const showDetailsAction = screen.getByRole('button', { name: 'View stack' });
      userEvent.click(showDetailsAction);

      expect(mockOnError).not.toHaveBeenCalled();
      expect(screen.queryByText('in BadComponent', { exact: false })).toBeTruthy();
      expect(screen.queryByText('in ErrorBoundary', { exact: false })).toBeTruthy();

      userEvent.click(showDetailsAction);

      expect(screen.queryByText('in BadComponent', { exact: false })).toBeFalsy();
      expect(screen.queryByText('in ErrorBoundary', { exact: false })).toBeFalsy();
    });
  });

  describe('when some resources are absent', () => {
    const { reload } = window.location;

    beforeEach(() => {
      delete (window as any).location;
      (window.location as any) = { reload: jest.fn() };

      jest.useFakeTimers();
    });

    afterEach(() => {
      window.location.reload = reload;
      sessionStorage.removeItem(STORAGE_KEY_RELOAD_NUMBER);

      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should inform users that resources are missed', () => {
      const errorBoundary = wrapComponent(<NoResourceComponent />);
      render(errorBoundary);

      expect(mockOnError).toHaveBeenCalledWith('Loading chunk 23 failed.');
      expect(
        screen.queryByText('The application has been likely updated on the server.', {
          exact: false,
        }),
      ).toBeTruthy();
    });

    it('should provide the countdown to the next page reload', () => {
      jest.useFakeTimers();

      const errorBoundary = wrapComponent(<NoResourceComponent />);
      render(errorBoundary);

      expect(mockOnError).toHaveBeenCalledWith('Loading chunk 23 failed.');
      expect(
        screen.queryByText('Refreshing a page to get newer resources in', { exact: false }),
      ).toBeTruthy();
      expect(screen.queryByText('30 seconds', { exact: false })).toBeTruthy();

      jest.advanceTimersByTime(5000);
      expect(screen.queryByText('25 seconds', { exact: false })).toBeTruthy();
    });

    it('should hide the countdown when stopped', () => {
      const errorBoundary = wrapComponent(<NoResourceComponent />);
      render(errorBoundary);

      const stopCountdownAction = screen.getByRole('button', { name: 'Stop countdown' });
      userEvent.click(stopCountdownAction);

      expect(mockOnError).toHaveBeenCalledWith('Loading chunk 23 failed.');
      expect(
        screen.queryByText('Refreshing a page to get newer resources in', { exact: false }),
      ).toBeFalsy();
    });

    it('should not reload page when countdown is stopped', () => {
      const errorBoundary = wrapComponent(<NoResourceComponent />);
      render(errorBoundary);

      const stopCountdownAction = screen.getByRole('button', { name: 'Stop countdown' });
      userEvent.click(stopCountdownAction);

      jest.advanceTimersByTime(35000);
    });

    it('should reload the page when countdown ends', () => {
      const errorBoundary = wrapComponent(<NoResourceComponent />);
      render(errorBoundary);

      jest.advanceTimersByTime(35000);

      expect(mockOnError).toHaveBeenCalledWith('Loading chunk 23 failed.');
      expect(window.location.reload).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it('should reload the page by action', () => {
      const errorBoundary = wrapComponent(<NoResourceComponent />);
      render(errorBoundary);

      const reloadNowAction = screen.getByRole('button', { name: 'Reload now' });
      userEvent.click(reloadNowAction);
      userEvent.click(reloadNowAction);
      userEvent.click(reloadNowAction);

      expect(mockOnError).toHaveBeenCalledWith('Loading chunk 23 failed.');
      expect(window.location.reload).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalledTimes(3);
    });

    it('should show additional message after a few reloads', () => {
      const errorBoundary = wrapComponent(<NoResourceComponent />);
      render(errorBoundary);

      const reloadNowAction = screen.getByRole('button', { name: 'Reload now' });

      userEvent.click(reloadNowAction);

      // jest doesn't trigger the `window.onbeforeunload`
      // so it has to be done manually:
      // "refreshing" the page
      window.dispatchEvent(new Event('beforeunload'));
      render(errorBoundary);

      userEvent.click(reloadNowAction);

      // "refreshing" the page
      window.dispatchEvent(new Event('beforeunload'));
      render(errorBoundary);

      expect(mockOnError).toHaveBeenCalledWith('Loading chunk 23 failed.');
      expect(
        screen.queryByText(
          'Contact an administrator if refreshing continues after the next load.',
          { exact: true },
        ),
      ).toBeTruthy();
    });

    it('should reset the number of reloads', () => {
      const noResourceComponent = wrapComponent(<NoResourceComponent />);
      render(noResourceComponent);

      const reloadNowAction = screen.getByRole('button', { name: 'Reload now' });

      userEvent.click(reloadNowAction);

      // jest doesn't trigger the `window.onbeforeunload`
      // so it has to be done manually:
      // "refreshing" the page
      window.dispatchEvent(new Event('beforeunload'));
      render(noResourceComponent);

      userEvent.click(reloadNowAction);

      // "refreshing" the page
      window.dispatchEvent(new Event('beforeunload'));
      render(noResourceComponent);

      expect(sessionStorage.getItem(STORAGE_KEY_RELOAD_NUMBER)).toEqual('2');

      const goodComponent = wrapComponent(<GoodComponent />);

      // "refreshing" the page
      window.dispatchEvent(new Event('beforeunload'));
      render(goodComponent);

      // "refreshing" the page
      window.dispatchEvent(new Event('beforeunload'));
      render(goodComponent);

      expect(mockOnError).toHaveBeenCalledWith('Loading chunk 23 failed.');
      expect(sessionStorage.getItem(STORAGE_KEY_RELOAD_NUMBER)).toBeNull();
    });
  });
});
