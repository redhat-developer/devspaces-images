package configmaps

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/cache"
	"sigs.k8s.io/controller-runtime/pkg/cache/informertest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

var state testSetup

func TestMain(m *testing.M) {
	var err error
	state, err = setup()
	if err != nil {
		os.Exit(1)
	}
	code := m.Run()
	if err = teardown(state); err != nil {
		os.Exit(1)
	}
	os.Exit(code)
}

func TestCreatesFiles(t *testing.T) {
	cm := &corev1.ConfigMap{}
	cm.ObjectMeta.Name = "test"
	cm.Data = make(map[string]string)
	cm.Data["created1.txt"] = "data1"
	cm.Data["created2.txt"] = "data2"

	_, ctrl, err := testWith("", cm)
	if err != nil {
		t.Fatalf("Failed to setup up the test. %s", err)
	}

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name:      cm.ObjectMeta.Name,
			Namespace: cm.ObjectMeta.Namespace,
		},
	}
	ctrl.Reconcile(req)

	files, err := ioutil.ReadDir(state.workDir)
	if err != nil {
		t.Fatalf("Failed to read the sync dir. %s", err)
	}

	if len(files) != 2 {
		t.Fatalf("There should have been exactly 2 files in the sync dir but there were %d.", len(files))
	}

	foundCreated1 := false
	foundCreated2 := false

	for _, f := range files {
		if f.Name() == "created1.txt" {
			contents, err := ioutil.ReadFile(filepath.Join(state.workDir, f.Name()))
			if err == nil && string(contents) == "data1" {
				foundCreated1 = true
			}
		} else if f.Name() == "created2.txt" {
			contents, err := ioutil.ReadFile(filepath.Join(state.workDir, f.Name()))
			if err == nil && string(contents) == "data2" {
				foundCreated2 = true
			}
		}
	}

	if !foundCreated1 {
		t.Error("Failed to find the expected created1.txt with matching contents.")
	}

	if !foundCreated2 {
		t.Error("Failed to find the expected created2.txt with matching contents.")
	}
}

func TestUpdatesFiles(t *testing.T) {
	cm := &corev1.ConfigMap{}
	cm.ObjectMeta.Name = "test"
	cm.Data = make(map[string]string)
	cm.Data["created1.txt"] = "data1"
	cm.Data["created2.txt"] = "data2"

	_, ctrl, err := testWith("", cm)
	if err != nil {
		t.Fatalf("Failed to setup up the test. %s", err)
	}

	// make one of the files out of sync of the "cluster" so that we can see the update happening
	err = ioutil.WriteFile(filepath.Join(state.workDir, "created1.txt"), []byte("origdata"), 0644)
	if err != nil {
		t.Fatalf("Failed to precreate a file to be updated. %s", err)
	}

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name:      cm.ObjectMeta.Name,
			Namespace: cm.ObjectMeta.Namespace,
		},
	}
	ctrl.Reconcile(req)

	files, err := ioutil.ReadDir(state.workDir)
	if err != nil {
		t.Fatalf("Failed to read the sync dir. %s", err)
	}

	if len(files) != 2 {
		t.Fatalf("There should have been exactly 2 files in the sync dir but there were %d.", len(files))
	}

	foundCreated1 := false
	foundCreated2 := false

	for _, f := range files {
		if f.Name() == "created1.txt" {
			contents, err := ioutil.ReadFile(filepath.Join(state.workDir, f.Name()))
			if err == nil && string(contents) == "data1" {
				foundCreated1 = true
			}
		} else if f.Name() == "created2.txt" {
			contents, err := ioutil.ReadFile(filepath.Join(state.workDir, f.Name()))
			if err == nil && string(contents) == "data2" {
				foundCreated2 = true
			}
		}
	}

	if !foundCreated1 {
		t.Error("Failed to find the expected created1.txt with matching contents.")
	}

	if !foundCreated2 {
		t.Error("Failed to find the expected created2.txt with matching contents.")
	}
}

func TestDeletesFiles(t *testing.T) {
	cm := &corev1.ConfigMap{}
	cm.ObjectMeta.Name = "test"
	cm.Data = make(map[string]string)
	cm.Data["created2.txt"] = "data2"

	_, ctrl, err := testWith("", cm)
	if err != nil {
		t.Fatalf("Failed to setup up the test. %s", err)
	}

	// make one of the files out of sync of the "cluster" so that we can see the update happening
	err = ioutil.WriteFile(filepath.Join(state.workDir, "created1.txt"), []byte("data1"), 0644)
	if err != nil {
		t.Fatalf("Failed to precreate a file to be updated. %s", err)
	}

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name:      cm.ObjectMeta.Name,
			Namespace: cm.ObjectMeta.Namespace,
		},
	}
	ctrl.Reconcile(req)

	files, err := ioutil.ReadDir(state.workDir)
	if err != nil {
		t.Fatalf("Failed to read the sync dir. %s", err)
	}

	if len(files) != 1 {
		t.Fatalf("There should have been exactly 1 file in the sync dir but there were %d.", len(files))
	}

	foundCreated2 := false

	for _, f := range files {
		if f.Name() == "created2.txt" {
			contents, err := ioutil.ReadFile(filepath.Join(state.workDir, f.Name()))
			if err == nil && string(contents) == "data2" {
				foundCreated2 = true
			}
		}
	}

	if !foundCreated2 {
		t.Error("Failed to find the expected created2.txt with matching contents.")
	}
}

func TestPicksConfigMapsByLabel(t *testing.T) {
	cm1 := &corev1.ConfigMap{}
	cm1.ObjectMeta.Name = "test1"
	cm1.Data = make(map[string]string)
	cm1.Data["created1.txt"] = "data1"
	cm2 := &corev1.ConfigMap{}
	cm2.ObjectMeta.Name = "test2"
	cm2.ObjectMeta.Labels = make(map[string]string)
	cm2.ObjectMeta.Labels["bump"] = "true"
	cm2.Data = make(map[string]string)
	cm2.Data["created2.txt"] = "data2"

	_, ctrl, err := testWith("bump=true", cm1, cm2)
	if err != nil {
		t.Fatalf("Failed to setup up the test. %s", err)
	}

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name:      cm1.ObjectMeta.Name,
			Namespace: cm1.ObjectMeta.Namespace,
		},
	}
	ctrl.Reconcile(req)

	req = reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name:      cm2.ObjectMeta.Name,
			Namespace: cm2.ObjectMeta.Namespace,
		},
	}
	ctrl.Reconcile(req)

	files, err := ioutil.ReadDir(state.workDir)
	if err != nil {
		t.Fatalf("Failed to read the sync dir. %s", err)
	}

	if len(files) != 1 {
		t.Fatalf("There should have been exactly 1 file in the sync dir but there were %d.", len(files))
	}

	foundCreated2 := false

	for _, f := range files {
		if f.Name() == "created2.txt" {
			contents, err := ioutil.ReadFile(filepath.Join(state.workDir, f.Name()))
			if err == nil && string(contents) == "data2" {
				foundCreated2 = true
			}
		}
	}

	if !foundCreated2 {
		t.Error("Failed to find the expected created2.txt with matching contents.")
	}
}

func testWith(labels string, cms ...runtime.Object) (client.Client, reconcile.Reconciler, error) {
	cl := fake.NewFakeClient(cms...)

	cfg := rest.Config{}

	opts := manager.Options{
		NewClient: func(cache cache.Cache, config *rest.Config, options client.Options) (client.Client, error) {
			return cl, nil
		},
		MapperProvider: func(c *rest.Config) (meta.RESTMapper, error) {
			mapper := meta.NewDefaultRESTMapper(make([]schema.GroupVersion, 0))
			return mapper, nil
		},
		NewCache: func(config *rest.Config, opts cache.Options) (cache.Cache, error) {
			return cache.Cache(&informertest.FakeInformers{}), nil
		},
		MetricsBindAddress:     "0",
	}
	mgr, err := manager.New(&cfg, opts)

	if err != nil {
		return nil, nil, err
	}

	ctrl, err := New(mgr, ConfigMapReconcilerConfig{
		BaseDir: state.workDir,
		NewClient: func(*rest.Config) (client.Client, error) {
			return cl, nil
		},
		Labels: labels,
	})
	if err != nil {
		return nil, nil, err
	}

	return cl, ctrl, nil
}

func setup() (testSetup, error) {
	workDir, err := ioutil.TempDir("", "config-bump-test")
	if err != nil {
		return testSetup{}, err
	}

	return testSetup{
		workDir: workDir,
	}, nil
}

func teardown(s testSetup) error {
	return os.RemoveAll(s.workDir)
}

type testSetup struct {
	workDir string
}
