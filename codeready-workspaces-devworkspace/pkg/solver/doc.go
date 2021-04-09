// Package solver contains the implementation of the "workspace routing solver" which provides che-specific
// logic to the otherwise generic workspace routing controller.
// The workspace routing controller needs to be provided with a "solver getter" in its configuration prior
// to starting the reconciliation loop. See `CheRouterGetter`.
package solver
