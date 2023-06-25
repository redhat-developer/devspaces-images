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

import { V221DevfileComponents } from '@devfile/api';
import { dump } from 'js-yaml';
import { cloneDeep } from 'lodash';
import { FactoryParams } from '../../services/helpers/factoryFlow/buildFactoryParams';
import { DevfileAdapter } from '../../services/devfile/adapter';
import devfileApi from '../../services/devfileApi';
import { generateWorkspaceName } from '../../services/helpers/generateName';
import { getProjectName } from '../../services/helpers/getProjectName';
import { DevfileV2ProjectSource, FactoryResolver } from '../../services/helpers/types';
import {
  DEVWORKSPACE_DEVFILE_SOURCE,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '../../services/workspace-client/devworkspace/devWorkspaceClient';

/**
 * Returns a devfile from the FactoryResolver object.
 * @param devfileLike a Devfile.
 * @param data a FactoryResolver object.
 * @param location a source location.
 * @param defaultComponents Default components. These default components
 * are meant to be used when a Devfile does not contain any components.
 * @param namespace the namespace where the pod lives.
 * @param factoryParams a Partial<FactoryParams> object.
 */
export default function normalizeDevfileV2(
  devfileLike: devfileApi.DevfileLike,
  data: FactoryResolver,
  location: string,
  defaultComponents: V221DevfileComponents[],
  namespace: string,
  factoryParams: Partial<FactoryParams>,
): devfileApi.Devfile {
  const scmInfo = data['scm_info'];

  const projectName = getProjectName(scmInfo?.clone_url || location);
  const prefix = devfileLike.metadata?.generateName
    ? devfileLike.metadata.generateName
    : projectName;
  const name = devfileLike.metadata?.name || generateWorkspaceName(prefix);

  // set mandatory fields
  const devfile = cloneDeep(devfileLike) as devfileApi.Devfile;
  devfile.metadata.name = name;
  if (devfile.metadata.generateName) {
    delete devfile.metadata.generateName;
  }
  devfile.metadata.namespace = namespace;

  // propagate default components
  if (!devfile.parent && (!devfile.components || devfile.components.length === 0)) {
    devfile.components = cloneDeep(defaultComponents);
  }

  if (devfile.components && devfile.components.length > 0) {
    // apply the custom image from factory params
    if (factoryParams.image && devfile.components[0].container?.image) {
      devfile.components[0].container.image = factoryParams.image;
    }

    // temporary solution for fix che-server serialization bug with empty volume
    devfile.components.forEach(component => {
      if (Object.keys(component).length === 1 && component.name) {
        component.volume = {};
      }
    });
  }

  // add a default project
  const projects: DevfileV2ProjectSource[] = [];
  if (!devfile.projects?.length && scmInfo) {
    const origin = scmInfo.clone_url;
    const projectName = getProjectName(origin);
    const revision = scmInfo.branch;
    const project: DevfileV2ProjectSource = { name: projectName, git: { remotes: { origin } } };
    if (revision) {
      project.git.checkoutFrom = { revision };
    }
    projects.push(project);
    devfile.projects = projects;
  }

  // provide metadata about the origin of the devfile with DevWorkspace
  let devfileSource = '';
  if (data.source && scmInfo) {
    if (scmInfo.branch) {
      devfileSource = dump({
        scm: {
          repo: scmInfo['clone_url'],
          revision: scmInfo.branch,
          fileName: data.source,
        },
      });
    } else {
      devfileSource = dump({
        scm: {
          repo: scmInfo['clone_url'],
          fileName: data.source,
        },
      });
    }
  } else if (location) {
    devfileSource = dump({ url: { location } });
  }

  const attributes = DevfileAdapter.getAttributesFromDevfileV2(devfile);

  if (!attributes[DEVWORKSPACE_METADATA_ANNOTATION]) {
    attributes[DEVWORKSPACE_METADATA_ANNOTATION] = {};
  }
  attributes[DEVWORKSPACE_METADATA_ANNOTATION][DEVWORKSPACE_DEVFILE_SOURCE] = devfileSource;

  return devfile;
}
