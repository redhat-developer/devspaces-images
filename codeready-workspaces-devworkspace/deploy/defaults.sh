#!/bin/sh

# Note that this file needs to work both in a shell script and in a makefile.
# Refrain from anything else but defining variables. Don't even reference other variables.

DEFAULT_DWCO_NAMESPACE=devworkspace-che
DEFAULT_DWCO_IMG=quay.io/che-incubator/devworkspace-che-operator:ci
DEFAULT_DWCO_PULL_POLICY=Always
