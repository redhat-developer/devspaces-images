/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import common from '@eclipse-che/common';
import { ValidatedOptions } from '@patternfly/react-core';

import * as helpers from '@/components/ImportFromGit/helpers';
import { formatBytes, getBytes } from '@/components/ImportFromGit/helpers';

describe('helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateLocation', () => {
    describe('has SSH key', () => {
      const hasSshKey = true;
      test('valid', () => {
        expect(helpers.validateLocation('http://test-location', hasSshKey)).toBe(
          ValidatedOptions.success,
        );
        expect(helpers.validateLocation('git@github.com:test/test.git', hasSshKey)).toBe(
          ValidatedOptions.success,
        );
      });
      test('invalid', () => {
        expect(helpers.validateLocation('', hasSshKey)).toBe(ValidatedOptions.error);
        expect(helpers.validateLocation('http://', hasSshKey)).toBe(ValidatedOptions.error);
        expect(helpers.validateLocation('git@github.com', hasSshKey)).toBe(ValidatedOptions.error);
      });
    });
    describe('without SSH key', () => {
      const hasSshKey = false;
      test('valid', () => {
        expect(helpers.validateLocation('http://test-location', hasSshKey)).toBe(
          ValidatedOptions.success,
        );
      });
      test('invalid', () => {
        expect(helpers.validateLocation('', hasSshKey)).toBe(ValidatedOptions.error);
        expect(helpers.validateLocation('http://', hasSshKey)).toBe(ValidatedOptions.error);
        expect(helpers.validateLocation('git@github.com', hasSshKey)).toBe(ValidatedOptions.error);
        expect(helpers.validateLocation('git@github.com:test/test.git', hasSshKey)).toBe(
          ValidatedOptions.error,
        );
      });
    });
  });

  describe('supportedProviders', () => {
    test('should includes "github", "gitlab" and "bitbucket"', () => {
      expect(helpers.supportedProviders).toEqual([
        'github',
        'gitlab',
        'bitbucket-server',
        'azure-devops',
      ]);
    });
  });

  describe('getSupportedGitService', () => {
    test('should return provider', () => {
      expect(helpers.getSupportedGitService('https://github.com')).toBe('github');
      expect(helpers.getSupportedGitService('https://gitlab.com')).toBe('gitlab');
      expect(helpers.getSupportedGitService('https://bitbucket.org')).toBe('bitbucket-server');
      expect(helpers.getSupportedGitService('https://dev.azure.com')).toBe('azure-devops');
    });

    test('should throw error when provider is not supported', () => {
      expect(() => helpers.getSupportedGitService('https://not-supported.com')).toThrowError(
        'Provider not supported: not-supported.com',
      );
    });
  });

  describe('isSupportedGitService', () => {
    test('should return true when provider is supported', () => {
      expect(helpers.isSupportedGitService('https://github.com')).toBe(true);
      expect(helpers.isSupportedGitService('https://gitlab.com')).toBe(true);
      expect(helpers.isSupportedGitService('https://bitbucket.org')).toBe(true);
      expect(helpers.isSupportedGitService('https://dev.azure.com')).toBe(true);
    });

    test('should return false when provider is not supported', () => {
      expect(helpers.isSupportedGitService('https://not-supported.com')).toBe(false);
    });
  });

  describe('getBranchFromLocation', () => {
    describe('supported GitServices', () => {
      const branch = 'main';
      describe('github', () => {
        test('should return the empty value', () => {
          expect(
            helpers.getBranchFromLocation('https://github.com/eclipse-che/che-dashboard.git'),
          ).toBeUndefined();
        });
        test('should return the branch', () => {
          expect(
            helpers.getBranchFromLocation(
              `https://github.com/eclipse-che/che-dashboard/tree/${branch}`,
            ),
          ).toBe(branch);
        });
      });
      describe('gitlab', () => {
        test('should return the empty value', () => {
          expect(
            helpers.getBranchFromLocation('https://gitlab.com/eclipse-che/che-dashboard.git'),
          ).toBeUndefined();
        });
        test('should return the branch', () => {
          expect(
            helpers.getBranchFromLocation(
              `https://gitlab.com/eclipse-che/che-dashboard/-/tree/${branch}`,
            ),
          ).toBe(branch);
        });
      });
      describe('Bitbucket', () => {
        test('should return the empty value', () => {
          expect(
            helpers.getBranchFromLocation('https://bitbucket.org/eclipse-che/che-dashboard.git'),
          ).toBeUndefined();
        });
        test('should return the branch', () => {
          expect(
            helpers.getBranchFromLocation(
              `https://bitbucket.org/eclipse-che/che-dashboard/src/${branch}`,
            ),
          ).toBe(branch);
        });
      });
      describe('Azure', () => {
        test('should return the empty value', () => {
          expect(
            helpers.getBranchFromLocation(
              'https://dev.azure.com/marioloriedo/publicproject/_git/public-repo',
            ),
          ).toBeUndefined();
        });
        test('should return the branch', () => {
          expect(
            helpers.getBranchFromLocation(
              `https://dev.azure.com/testuser/publicproject/_git/public-repo%3Fversion=GB${branch}`,
            ),
          ).toBe(branch);
        });
      });
    });

    describe('unsupported Git provider', () => {
      test('should throw the error', () => {
        let branch: string | undefined;
        let errorMessage: string | undefined;
        try {
          branch = helpers.getBranchFromLocation('https://not-supported.com');
        } catch (e) {
          errorMessage = common.helpers.errors.getMessage(e);
        } finally {
          expect(branch).toBeUndefined();
          expect(errorMessage).toBe('Provider not supported: not-supported.com');
        }
      });
    });
  });

  describe('setBranchToLocation', () => {
    describe('supported GitServices', () => {
      const branch = 'main';
      describe('Github', () => {
        test('should return the location without branch', () => {
          expect(
            helpers.setBranchToLocation(
              `https://github.com/eclipse-che/che-dashboard.git/tree/${branch}`,
              undefined,
            ),
          ).toBe('https://github.com/eclipse-che/che-dashboard.git');
        });
        test('should return the location with branch', () => {
          expect(
            helpers.setBranchToLocation('https://github.com/eclipse-che/che-dashboard.git', branch),
          ).toBe(`https://github.com/eclipse-che/che-dashboard.git/tree/${branch}`);
        });
      });
      describe('Gitlab', () => {
        test('should return the location without branch', () => {
          expect(
            helpers.setBranchToLocation(
              `https://gitlab.com/eclipse-che/che-dashboard.git/-/tree/${branch}`,
              undefined,
            ),
          ).toBe('https://gitlab.com/eclipse-che/che-dashboard.git');
        });
        test('should return the location with branch', () => {
          expect(
            helpers.setBranchToLocation('https://gitlab.com/eclipse-che/che-dashboard.git', branch),
          ).toBe(`https://gitlab.com/eclipse-che/che-dashboard.git/-/tree/${branch}`);
        });
      });
      describe('Bitbucket', () => {
        test('should return the location without branch', () => {
          expect(
            helpers.setBranchToLocation(
              `https://bitbucket.org/eclipse-che/che-dashboard.git/src/${branch}`,
              undefined,
            ),
          ).toBe('https://bitbucket.org/eclipse-che/che-dashboard.git');
        });
        test('should return the location with branch', () => {
          expect(
            helpers.setBranchToLocation(
              'https://bitbucket.org/eclipse-che/che-dashboard.git',
              branch,
            ),
          ).toBe(`https://bitbucket.org/eclipse-che/che-dashboard.git/src/${branch}`);
        });
      });
      describe('Azure', () => {
        test('should return the location without branch', () => {
          expect(
            helpers.setBranchToLocation(
              `https://dev.azure.com/testuser/publicproject/_git/public-repo%3Fpath=%2F&version=GB${branch}`,
              undefined,
            ),
          ).toBe('https://dev.azure.com/testuser/publicproject/_git/public-repo%3Fpath%3D%252F');
        });
        test('should return the location with branch', () => {
          expect(
            helpers.setBranchToLocation(
              'https://dev.azure.com/testuser/publicproject/_git/public-repo',
              branch,
            ),
          ).toBe(
            `https://dev.azure.com/testuser/publicproject/_git/public-repo%3Fversion%3DGB${branch}`,
          );
        });
      });
    });
    describe('unsupported Git provider', () => {
      test('should throw the error', () => {
        let location: string | undefined;
        let errorMessage: string | undefined;
        try {
          location = helpers.setBranchToLocation('https://not-supported.com', 'main');
        } catch (e) {
          errorMessage = common.helpers.errors.getMessage(e);
        } finally {
          expect(location).toBeUndefined();
          expect(errorMessage).toBe('Provider not supported: not-supported.com');
        }
      });
    });
  });
  describe('getGitRepoOptionsFromLocation', () => {
    describe('supported Git services', () => {
      describe('HTTP', () => {
        test('should return options from location without parameters', () => {
          const location = 'https://github.com/eclipse-che/che-dashboard.git';
          const options = helpers.getGitRepoOptionsFromLocation(location);
          expect(options).toEqual({
            location: 'https://github.com/eclipse-che/che-dashboard.git',
            hasSupportedGitService: true,
            gitBranch: undefined,
            remotes: [],
            devfilePath: undefined,
          });
        });
        test('should return options from location with params with empty values', () => {
          let options = helpers.getGitRepoOptionsFromLocation(
            'https://github.com/eclipse-che/che-dashboard.git?remotes&devfilePath',
          );
          expect(options).toEqual({
            location: 'https://github.com/eclipse-che/che-dashboard.git',
            hasSupportedGitService: true,
            gitBranch: undefined,
            remotes: undefined,
            devfilePath: undefined,
          });

          options = helpers.getGitRepoOptionsFromLocation(
            'https://github.com/eclipse-che/che-dashboard.git?remotes={}&df',
          );

          expect(options).toEqual({
            location: 'https://github.com/eclipse-che/che-dashboard.git',
            hasSupportedGitService: true,
            gitBranch: undefined,
            remotes: undefined,
            devfilePath: undefined,
          });
        });
        test('should return all supported options', () => {
          const location =
            'https://github.com/eclipse-che/che-dashboard/tree/main?remotes={{test-1,http://test-1.git}}&df=devfile2.yaml';
          const options = helpers.getGitRepoOptionsFromLocation(location);
          expect(options).toEqual({
            location:
              'https://github.com/eclipse-che/che-dashboard/tree/main?remotes=%7B%7Btest-1%2Chttp%3A%2F%2Ftest-1.git%7D%7D&devfilePath=devfile2.yaml',
            hasSupportedGitService: true,
            gitBranch: 'main',
            remotes: [{ name: 'test-1', url: 'http://test-1.git' }],
            devfilePath: 'devfile2.yaml',
          });
        });
      });
      describe('SSH', () => {
        test('should return options from location without parameters', () => {
          const location = 'git@github.com:eclipse-che/che-dashboard.git';
          const options = helpers.getGitRepoOptionsFromLocation(location);
          expect(options).toEqual({
            location: 'git@github.com:eclipse-che/che-dashboard.git',
            hasSupportedGitService: false,
            gitBranch: undefined,
            remotes: [],
            devfilePath: undefined,
          });
        });
        test('should return all supported options', () => {
          const location =
            'git@github.com:eclipse-che/che-dashboard.git?remotes={{test-1,http://test-1.git}}&df=devfile2.yaml';
          const options = helpers.getGitRepoOptionsFromLocation(location);
          expect(options).toEqual({
            location:
              'git@github.com:eclipse-che/che-dashboard.git?remotes=%7B%7Btest-1%2Chttp%3A%2F%2Ftest-1.git%7D%7D&devfilePath=devfile2.yaml',
            hasSupportedGitService: false,
            gitBranch: undefined,
            remotes: [{ name: 'test-1', url: 'http://test-1.git' }],
            devfilePath: 'devfile2.yaml',
          });
        });
      });
    });
    describe('unsupported Git provider', () => {
      test('should return all supported variants except the branch', () => {
        const location =
          'https://not-supported.com?remotes={{test-1,http://test-1.git}}&df=devfile2.yaml';
        const options = helpers.getGitRepoOptionsFromLocation(location);
        expect(options).toEqual({
          location:
            'https://not-supported.com?remotes=%7B%7Btest-1%2Chttp%3A%2F%2Ftest-1.git%7D%7D&devfilePath=devfile2.yaml',
          hasSupportedGitService: false,
          gitBranch: undefined,
          remotes: [{ name: 'test-1', url: 'http://test-1.git' }],
          devfilePath: 'devfile2.yaml',
          containerImage: undefined,
          temporaryStorage: undefined,
          createNewIfExisting: undefined,
          memoryLimit: undefined,
          cpuLimit: undefined,
        });
      });
    });
  });

  describe('getAdvancedOptionsFromLocation', () => {
    describe('HTTP', () => {
      test('should return options from location without parameters', () => {
        const location = 'https://github.com/eclipse-che/che-dashboard.git';
        const options = helpers.getAdvancedOptionsFromLocation(location);
        expect(options).toEqual({
          location: 'https://github.com/eclipse-che/che-dashboard.git',
          containerImage: undefined,
          temporaryStorage: undefined,
          createNewIfExisting: undefined,
          memoryLimit: undefined,
          cpuLimit: undefined,
        });
      });
      test('should return options from location with params with empty values', () => {
        const location =
          'https://github.com/eclipse-che/che-dashboard.git?image&policies.create&memoryLimit&storageType';
        const options = helpers.getAdvancedOptionsFromLocation(location);
        expect(options).toEqual({
          location: 'https://github.com/eclipse-che/che-dashboard.git',
          containerImage: undefined,
          temporaryStorage: undefined,
          createNewIfExisting: undefined,
          memoryLimit: undefined,
          cpuLimit: undefined,
        });
      });
      test('should return all supported options', () => {
        const location =
          'https://github.com/eclipse-che/che-dashboard/tree/main?image=custom-image&new&memoryLimit=2Gi&cpuLimit=1&storageType=ephemeral';
        const options = helpers.getAdvancedOptionsFromLocation(location);
        expect(options).toEqual({
          location:
            'https://github.com/eclipse-che/che-dashboard/tree/main?storageType=ephemeral&image=custom-image&cpuLimit=1&memoryLimit=2Gi&policies.create=perclick',
          containerImage: 'custom-image',
          temporaryStorage: true,
          createNewIfExisting: true,
          memoryLimit: 2147483648,
          cpuLimit: 1,
        });
      });
    });
    describe('SSH', () => {
      test('should return options from location without parameters', () => {
        const location = 'git@github.com:eclipse-che/che-dashboard.git';
        const options = helpers.getAdvancedOptionsFromLocation(location);
        expect(options).toEqual({
          location: 'git@github.com:eclipse-che/che-dashboard.git',
          containerImage: undefined,
          temporaryStorage: undefined,
          createNewIfExisting: undefined,
          memoryLimit: undefined,
          cpuLimit: undefined,
        });
      });
      test('should return all supported options', () => {
        const location =
          'git@github.com:eclipse-che/che-dashboard.git?image=custom-image&new&memoryLimit=2Gi&cpuLimit=1&storageType=ephemeral';
        const options = helpers.getAdvancedOptionsFromLocation(location);
        expect(options).toEqual({
          location:
            'git@github.com:eclipse-che/che-dashboard.git?storageType=ephemeral&image=custom-image&cpuLimit=1&memoryLimit=2Gi&policies.create=perclick',
          containerImage: 'custom-image',
          temporaryStorage: true,
          createNewIfExisting: true,
          memoryLimit: 2147483648,
          cpuLimit: 1,
        });
      });
    });
  });

  describe('setGitRepoOptionsToLocation', () => {
    describe('supported Git services', () => {
      describe('HTTP', () => {
        test('should return options with updated location(set search params)', () => {
          const newOptions = {
            gitBranch: 'test-branch',
            remotes: [{ name: 'test-2', url: 'http://test-2.git' }],
            devfilePath: 'devfile3.yaml',
          };
          const currentOptions = {
            location: 'https://github.com/eclipse-che/che-dashboard/tree/main',
            gitBranch: undefined,
            remotes: undefined,
            devfilePath: undefined,
          };
          const options = helpers.setGitRepoOptionsToLocation(newOptions, currentOptions);
          expect(options).toEqual({
            location:
              'https://github.com/eclipse-che/che-dashboard/tree/test-branch?remotes={{test-2,http://test-2.git}}&devfilePath=devfile3.yaml',
            gitBranch: 'test-branch',
            remotes: [{ name: 'test-2', url: 'http://test-2.git' }],
            devfilePath: 'devfile3.yaml',
          });
        });
        test('should return options with updated location(reset search params)', () => {
          const newOptions = {
            gitBranch: undefined,
            remotes: undefined,
            devfilePath: undefined,
          };
          const currentOptions = {
            location:
              'https://github.com/eclipse-che/che-dashboard/tree/main?remotes={{test-1,http://test-1.git}}&df=devfile2.yaml',
            gitBranch: 'main',
            remotes: [{ name: 'test-1', url: 'http://test-1.git' }],
            devfilePath: 'devfile2.yaml',
          };
          const options = helpers.setGitRepoOptionsToLocation(newOptions, currentOptions);
          expect(options).toEqual({
            location: 'https://github.com/eclipse-che/che-dashboard',
            gitBranch: undefined,
            remotes: undefined,
            devfilePath: undefined,
          });
        });
      });
      describe('SSH', () => {
        test('should return options with updated location', () => {
          const newOptions = {
            gitBranch: undefined,
            remotes: [{ name: 'test-2', url: 'http://test-2.git' }],
            devfilePath: 'devfile3.yaml',
          };
          const currentOptions = {
            location:
              'git@github.com:eclipse-che/che-dashboard.git?remotes={{test-1,http://test-1.git}}&df=devfile2.yaml',
            gitBranch: undefined,
            remotes: [{ name: 'test-1', url: 'http://test-1.git' }],
            devfilePath: 'devfile2.yaml',
          };
          const options = helpers.setGitRepoOptionsToLocation(newOptions, currentOptions);
          expect(options).toEqual({
            location:
              'git@github.com:eclipse-che/che-dashboard.git?remotes={{test-2,http://test-2.git}}&devfilePath=devfile3.yaml',
            gitBranch: undefined,
            remotes: [{ name: 'test-2', url: 'http://test-2.git' }],
            devfilePath: 'devfile3.yaml',
          });
        });
      });
      describe('unsupported Git provider', () => {
        test('should return options with updated location', () => {
          const newOptions = {
            gitBranch: undefined,
            remotes: [{ name: 'test-2', url: 'http://test-2.git' }],
            devfilePath: 'devfile3.yaml',
          };
          const currentOptions = {
            location:
              'http://not-supported.com?remotes={{test-1,http://test-1.git}}&df=devfile2.yaml',
            gitBranch: undefined,
            remotes: [{ name: 'test-1', url: 'http://test-1.git' }],
            devfilePath: 'devfile2.yaml',
          };
          const options = helpers.setGitRepoOptionsToLocation(newOptions, currentOptions);
          expect(options).toEqual({
            location:
              'http://not-supported.com?remotes={{test-2,http://test-2.git}}&devfilePath=devfile3.yaml',
            gitBranch: undefined,
            remotes: [{ name: 'test-2', url: 'http://test-2.git' }],
            devfilePath: 'devfile3.yaml',
          });
        });
      });
    });
  });
  describe('setAdvancedOptionsToLocation', () => {
    describe('supported Git services', () => {
      describe('HTTP', () => {
        test('should return options with updated location(set search params)', () => {
          const newOptions = {
            containerImage: 'custom-image',
            temporaryStorage: true,
            createNewIfExisting: true,
            memoryLimit: 2147483648,
            cpuLimit: 1,
          };
          const currentOptions = {
            location: 'https://github.com/eclipse-che/che-dashboard.git',
            containerImage: undefined,
            temporaryStorage: undefined,
            createNewIfExisting: undefined,
            memoryLimit: undefined,
            cpuLimit: undefined,
          };
          const options = helpers.setAdvancedOptionsToLocation(newOptions, currentOptions);
          expect(options).toEqual({
            location:
              'https://github.com/eclipse-che/che-dashboard.git?image=custom-image&storageType=ephemeral&policies.create=perclick&memoryLimit=2Gi&cpuLimit=1',
            containerImage: 'custom-image',
            temporaryStorage: true,
            createNewIfExisting: true,
            memoryLimit: 2147483648,
            cpuLimit: 1,
          });
        });
        test('should return options with updated location(reset search params)', () => {
          const newOptions = {
            containerImage: undefined,
            temporaryStorage: undefined,
            createNewIfExisting: undefined,
            memoryLimit: undefined,
            cpuLimit: undefined,
          };
          const currentOptions = {
            location: 'https://github.com/eclipse-che/che-dashboard.git',
            containerImage: 'custom-image',
            temporaryStorage: true,
            createNewIfExisting: true,
            memoryLimit: 2147483648,
            cpuLimit: undefined,
          };
          const options = helpers.setAdvancedOptionsToLocation(newOptions, currentOptions);
          expect(options).toEqual({
            location: 'https://github.com/eclipse-che/che-dashboard.git',
            containerImage: undefined,
            temporaryStorage: undefined,
            createNewIfExisting: undefined,
            memoryLimit: undefined,
            cpuLimit: undefined,
          });
        });
      });
      describe('SSH', () => {
        test('should return options with updated location', () => {
          const newOptions = {
            containerImage: 'custom-image',
            temporaryStorage: true,
            createNewIfExisting: true,
            memoryLimit: 2147483648,
            cpuLimit: 1,
          };
          const currentOptions = {
            location: 'git@github.com:eclipse-che/che-dashboard.git',
            containerImage: undefined,
            temporaryStorage: undefined,
            createNewIfExisting: undefined,
            memoryLimit: undefined,
            cpuLimit: undefined,
          };
          const options = helpers.setAdvancedOptionsToLocation(newOptions, currentOptions);
          expect(options).toEqual({
            location:
              'git@github.com:eclipse-che/che-dashboard.git?image=custom-image&storageType=ephemeral&policies.create=perclick&memoryLimit=2Gi&cpuLimit=1',
            containerImage: 'custom-image',
            temporaryStorage: true,
            createNewIfExisting: true,
            memoryLimit: 2147483648,
            cpuLimit: 1,
          });
        });
      });
    });
  });
  describe('units of memory measurements', () => {
    describe('getBytes', () => {
      test('should return Bytes depends on measurements', () => {
        const values = [
          '', // error value
          '534',
          '1 KB',
          '4.5Mi',
          '10Gi',
          '1.5 TiB',
          '2.5 PiB',
          '2QQQ', // error value
          'undefined', // error value
        ].map(val => getBytes(val));

        expect(values).toEqual([
          undefined,
          534,
          1000,
          4718592,
          10737418240,
          1649267441664,
          2814749767106560,
          undefined,
          undefined,
        ]);
      });
    });
    describe('formatBytes', () => {
      test('should return formated memory measurements', () => {
        const values = [
          0,
          534,
          4718592,
          10737418240,
          1649267441664,
          2814749767106560,
          undefined,
        ].map(val => formatBytes(val, 2, false));

        expect(values).toEqual([undefined, '534', '4.72M', '10.74G', '1.65T', '2.81P', undefined]);
      });
      test('should return formated memory measurements(binaryUnits)', () => {
        const values = [
          0,
          534,
          1000,
          4718592,
          10737418240,
          1649267441664,
          2814749767106560,
          undefined,
        ].map(val => formatBytes(val));

        expect(values).toEqual([
          undefined,
          '534',
          '1000',
          '4.5Mi',
          '10Gi',
          '1.5Ti',
          '2.5Pi',
          undefined,
        ]);
      });
    });
  });
});
