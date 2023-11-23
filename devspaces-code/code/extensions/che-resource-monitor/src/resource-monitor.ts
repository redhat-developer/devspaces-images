/**********************************************************************
 * Copyright (c) 2022 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

/* eslint-disable header/header */

import * as vscode from 'vscode';

import { Container, MetricContainer, Metrics } from './objects';
import { SHOW_RESOURCES_INFORMATION_COMMAND, SHOW_WARNING_MESSAGE_COMMAND, Units } from './constants';
import { convertToBytes, convertToMilliCPU } from './units-converter';
import { inject, injectable } from 'inversify';

import { K8sHelper } from './k8s-helper';

@injectable()
export class ResourceMonitor {
  @inject(K8sHelper)
  private k8sHelper!: K8sHelper;

  private METRICS_SERVER_ENDPOINT = '/apis/metrics.k8s.io/v1beta1/';
  private METRICS_REQUEST_URL = `${this.METRICS_SERVER_ENDPOINT}namespaces/`;
  private WARNING_COLOR = '#FFCC00';
  private DEFAULT_COLOR = '#FFFFFF';
  private DEFAULT_TOOLTIP = 'Workspace resources';
  private MONITOR_BANNED = '$(error) Resources';
  private MONITOR_WAIT_METRICS = '$(pulse) Waiting metrics...';

  private MISSING_POD_NAME = "Failure to get workspace metrics. Workspace pod name is not configured.";
  private MISSING_POD_NAME_WARNING = "Failure to get workspace metrics. Developer workspace pod name should be configured by setting DEVWORKSPACE_POD_NAME environment variable.";

  private warningMessage = '';

  private statusBarItem: vscode.StatusBarItem;
  private containers: Container[] = [];
  
  private namespace!: string;
  private podName!: string;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this.statusBarItem.color = this.DEFAULT_COLOR;
  }

  async start(context: vscode.ExtensionContext, namespace: string, podName: string): Promise<void> {
    context.subscriptions.push(
      vscode.commands.registerCommand(SHOW_RESOURCES_INFORMATION_COMMAND, () => this.showDetailedInfo()),
      vscode.commands.registerCommand(SHOW_WARNING_MESSAGE_COMMAND, () => this.showWarningMessage())
    );

    this.namespace = namespace;
    this.podName = podName;
    
    if (!podName) {
      this.displayWithError(this.MISSING_POD_NAME, this.MISSING_POD_NAME_WARNING);
      return;
    }

    this.show();
  }

  async show(): Promise<void> {
    await this.updateContainers();
    await this.requestMetricsServer();

    this.statusBarItem.text = this.MONITOR_WAIT_METRICS;
    this.statusBarItem.tooltip = 'Loading...';
    this.statusBarItem.show();

    setInterval(() => this.getMetrics(), 5000);
  }

  async displayWithError(tooltip: string, warning: string) {
    this.statusBarItem.text = this.MONITOR_BANNED;
    this.statusBarItem.tooltip = tooltip;
    this.statusBarItem.command = SHOW_WARNING_MESSAGE_COMMAND;
    this.statusBarItem.show();
    
    this.warningMessage = warning;
  }

  async updateContainers(): Promise<void> {
    try {
      const { body } = await this.k8sHelper
        .getCoreApi()
        .listNamespacedPod(this.namespace, undefined, undefined, undefined, undefined, undefined);
      for (const item of body.items) {
        if (item.metadata?.name === this.podName) {
          item.spec?.containers.forEach(element => {
            this.containers.push({
              name: element.name,
              cpuLimit: convertToMilliCPU(element.resources?.limits?.cpu),
              memoryLimit: convertToBytes(element.resources?.limits?.memory),
            });
          });

          return;
        }
      }

      throw new Error(`Pod ${this.podName} is not found.`);
    } catch (e) {
      const msg = 'Failure to get workspace pod. ' + e.message;
      this.displayWithError('Failure to get workspace pod', msg);
      throw new Error(msg);
    }
  }

  async requestMetricsServer(): Promise<void> {
    const result = await this.k8sHelper.sendRawQuery(this.METRICS_SERVER_ENDPOINT, { url: this.METRICS_SERVER_ENDPOINT });
    if (result.statusCode !== 200) {
      this.displayWithError('Metrics Server is not enabled', 'Resource monitor won\'t be displayed. Metrics Server is not enabled on the cluster.');
      throw new Error(`Cannot connect to Metrics Server. Status code: ${result.statusCode}. Error: ${result.data}`);
    }
  }

  async getMetrics(): Promise<Container[]> {
    const requestURL = `${this.METRICS_REQUEST_URL}${this.namespace}/pods/${this.podName}`;
    const opts = { url: this.METRICS_SERVER_ENDPOINT };
    const response = await this.k8sHelper.sendRawQuery(requestURL, opts);

    if (response.statusCode !== 200) {
      // wait when workspace pod's metrics will be available
      if (response.statusCode === 404) {
        this.statusBarItem.text = this.MONITOR_WAIT_METRICS;
      } else {
        this.statusBarItem.text = this.MONITOR_BANNED;
        this.warningMessage = `Resource monitor won't be displayed. Cannot read metrics: ${response.data}.`;
        this.statusBarItem.command = SHOW_WARNING_MESSAGE_COMMAND;
      }
      return this.containers;
    }

    this.statusBarItem.command = SHOW_RESOURCES_INFORMATION_COMMAND;
    const metrics: Metrics = JSON.parse(response.data);
    metrics.containers.forEach(element => {
      this.setUsedResources(element);
    });

    this.updateStatusBar();
    return this.containers;
  }

  setUsedResources(element: MetricContainer): void {
    this.containers.map(container => {
      if (container.name === element.name) {
        container.cpuUsed = convertToMilliCPU(element.usage.cpu);
        container.memoryUsed = convertToBytes(element.usage.memory);
        return;
      }
    });
  }

  updateStatusBar(): void {
    let memTotal = 0;
    let memUsed = 0;
    let cpuUsed = 0;
    let text = '';
    let color = this.DEFAULT_COLOR;
    let tooltip = this.DEFAULT_TOOLTIP;
    this.containers.forEach(element => {
      if (element.memoryLimit) {
        memTotal += element.memoryLimit;
      }
      if (element.memoryUsed) {
        memUsed += element.memoryUsed;
      }
      if (element.cpuUsed) {
        cpuUsed += element.cpuUsed;
      }
      // if a container uses more than 90% of limited memory, show it in status bar with warning color
      if (element.memoryLimit && element.memoryUsed && element.memoryUsed / element.memoryLimit > 0.9) {
        color = this.WARNING_COLOR;
        tooltip = `${element.name} container`;
        text = this.buildStatusBarMessage(element.memoryUsed, element.memoryLimit, element.cpuUsed);
      }
    });

    // show workspace resources in total
    if (color === this.DEFAULT_COLOR) {
      text = this.buildStatusBarMessage(memUsed, memTotal, cpuUsed);
    }

    this.statusBarItem.text = text;
    this.statusBarItem.color = color;
    this.statusBarItem.tooltip = tooltip;
  }

  buildStatusBarMessage(memoryUsed: number, memoryLimit: number, cpuUsaed: number | undefined): string {
    const unitId = memoryLimit > Units.G ? 'GB' : 'MB';
    const unit = memoryLimit > Units.G ? Units.G : Units.M;

    let used: number | string;
    let limited: number | string;
    const memPct = Math.floor((memoryUsed / memoryLimit) * 100);
    if (unit === Units.G) {
      used = (memoryUsed / unit).toFixed(2);
      limited = (memoryLimit / unit).toFixed(2);
    } else {
      used = Math.floor(memoryUsed / unit);
      limited = Math.floor(memoryLimit / unit);
    }
    let message = `$(ellipsis) Mem: ${used}/${limited} ${unitId} ${memPct}%`;
    if (cpuUsaed) {
      message = `${message} $(pulse) CPU: ${cpuUsaed} m`;
    }
    return message;
  }

  showDetailedInfo(): void {
    const items: vscode.QuickPickItem[] = [];
    this.containers.forEach(element => {
      const memUsed = element.memoryUsed ? Math.floor(element.memoryUsed / Units.M) : '';
      const memLimited = element.memoryLimit ? Math.floor(element.memoryLimit / Units.M) : '';
      const cpuUsed = element.cpuUsed;
      const cpuLimited = element.cpuLimit ? `${element.cpuLimit}m` : 'not set';

      items.push(<vscode.QuickPickItem>{
        label: element.name,
        detail: `Mem (MB): ${memUsed} (Used) / ${memLimited} (Limited) | CPU : ${cpuUsed}m (Used) / ${cpuLimited} (Limited)`,
      });
    });
    vscode.window.showQuickPick(items, {});
  }

  showWarningMessage(): void {
    vscode.window.showWarningMessage(this.warningMessage);
  }
}
