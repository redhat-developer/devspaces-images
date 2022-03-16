/*
 * Copyright (c) 2012-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */
package org.eclipse.che.workspace.infrastructure.kubernetes.namespace.log.event;

import java.util.Objects;
import java.util.StringJoiner;

/**
 * This event should be fired when WatchLog instance stopped and particular container's logs are no
 * longer watched.
 */
public class WatchLogStoppedEvent {

  private final String container;

  public WatchLogStoppedEvent(String container) {
    this.container = container;
  }

  public String getContainer() {
    return container;
  }

  @Override
  public String toString() {
    return new StringJoiner(", ", WatchLogStoppedEvent.class.getSimpleName() + "[", "]")
        .add("container='" + container + "'")
        .toString();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    WatchLogStoppedEvent that = (WatchLogStoppedEvent) o;
    return Objects.equals(container, that.container);
  }

  @Override
  public int hashCode() {
    return Objects.hash(container);
  }
}
