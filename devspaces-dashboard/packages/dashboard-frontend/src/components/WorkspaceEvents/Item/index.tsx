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

import { CoreV1Event } from '@kubernetes/client-node';
import {
  Card,
  CardBody,
  CardHeader,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { format } from 'date-fns';
import React from 'react';
import { ResourceIcon } from '../../ResourceIcon';
import styles from './index.module.css';

export type Props = {
  event: CoreV1Event;
};

export class WorkspaceEventsItem extends React.PureComponent<Props> {
  /**
   * Returns the involved object of the event, if available.
   */
  private getInvolvedObj(event: CoreV1Event): React.ReactElement {
    const kind = event.involvedObject.kind;
    const name = event.involvedObject.name;
    if (kind !== undefined && name !== undefined) {
      return (
        <span data-testid="event-involved-object">
          <ResourceIcon kind={kind} />
          {name}
        </span>
      );
    } else {
      return <></>;
    }
  }

  /**
   * Returns the source of the event, if available.
   */
  private getSource(event: CoreV1Event): React.ReactElement {
    const component = event.source?.component;
    const host = event.source?.host;

    if (component === undefined) {
      return <></>;
    }

    const source = component + (host ? ` on ${host}` : '');
    return <div>Generated from {source}</div>;
  }

  /**
   * Returns the time of the event, if available.
   */
  private getTime(event: CoreV1Event): React.ReactElement {
    const eventTime = event.lastTimestamp || event.eventTime;
    if (eventTime === undefined) {
      return <></>;
    }
    const time = format(new Date(eventTime), 'HH:mm:ss');
    return <span data-testid="event-time">{time}</span>;
  }

  render(): React.ReactElement {
    const { event } = this.props;

    return (
      <TextContent>
        <Card isCompact isFlat>
          <CardHeader className={styles.header}>
            <Flex>
              <FlexItem>
                <Text component={TextVariants.small}>
                  {this.getInvolvedObj(event)}
                  {this.getSource(event)}
                </Text>
              </FlexItem>
              <FlexItem align={{ default: 'alignRight' }}>
                <Text component={TextVariants.small}>{this.getTime(event)}</Text>
              </FlexItem>
            </Flex>
          </CardHeader>
          <CardBody>
            <Text>{event.message}</Text>
          </CardBody>
        </Card>
      </TextContent>
    );
  }
}
