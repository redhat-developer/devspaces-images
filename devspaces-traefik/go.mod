module github.com/traefik/traefik/v2

go 1.20

require (
	github.com/BurntSushi/toml v1.2.1
	github.com/ExpediaDotCom/haystack-client-go v0.0.0-20190315171017-e7edbdf53a61
	github.com/Masterminds/sprig/v3 v3.2.3
	github.com/abbot/go-http-auth v0.0.0-00010101000000-000000000000
	github.com/aws/aws-sdk-go v1.44.47
	github.com/cenkalti/backoff/v4 v4.2.1
	github.com/compose-spec/compose-go v1.0.3
	github.com/containous/alice v0.0.0-20181107144136-d83ebdd94cbd
	github.com/coreos/go-systemd v0.0.0-20191104093116-d3cd4ed1dbcf
	github.com/davecgh/go-spew v1.1.1
	github.com/docker/cli v26.0.0+incompatible
	github.com/docker/compose/v2 v2.26.0
	github.com/docker/docker v26.0.0+incompatible
	github.com/docker/go-connections v0.5.0
	github.com/fatih/structs v1.1.0
	github.com/gambol99/go-marathon v0.0.0-20180614232016-99a156b96fb2
	github.com/go-acme/lego/v4 v4.10.2
	github.com/go-check/check v0.0.0-00010101000000-000000000000
	github.com/go-kit/kit v0.10.1-0.20200915143503-439c4d2ed3ea
	github.com/golang/protobuf v1.5.3
	github.com/google/go-github/v28 v28.1.1
	github.com/gorilla/mux v1.8.1
	github.com/gorilla/websocket v1.5.0
	github.com/hashicorp/consul v1.10.12
	github.com/hashicorp/consul/api v1.14.0
	github.com/hashicorp/go-hclog v1.2.0
	github.com/hashicorp/go-multierror v1.1.1
	github.com/hashicorp/go-version v1.6.0
	github.com/hashicorp/nomad/api v0.0.0-20220506174431-b5665129cd1f
	github.com/influxdata/influxdb-client-go/v2 v2.7.0
	github.com/influxdata/influxdb1-client v0.0.0-20191209144304-8bf82d3c094d
	github.com/instana/go-sensor v1.38.3
	github.com/klauspost/compress v1.17.4
	github.com/kvtools/consul v1.0.2
	github.com/kvtools/etcdv3 v1.0.2
	github.com/kvtools/redis v1.0.2
	github.com/kvtools/valkeyrie v1.0.0
	github.com/kvtools/zookeeper v1.0.2
	github.com/mailgun/ttlmap v0.0.0-20170619185759-c1c17f74874f
	github.com/miekg/dns v1.1.50
	github.com/mitchellh/copystructure v1.2.0
	github.com/mitchellh/hashstructure v1.0.0
	github.com/mitchellh/mapstructure v1.5.0
	github.com/opentracing/opentracing-go v1.2.0
	github.com/openzipkin-contrib/zipkin-go-opentracing v0.4.5
	github.com/openzipkin/zipkin-go v0.2.2
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/pires/go-proxyproto v0.6.1
	github.com/pmezard/go-difflib v1.0.0
	github.com/prometheus/client_golang v1.17.0
	github.com/prometheus/client_model v0.5.0
	github.com/quic-go/quic-go v0.33.0
	github.com/rancher/go-rancher-metadata v0.0.0-20200311180630-7f4c936a06ac
	github.com/sirupsen/logrus v1.9.3
	github.com/stretchr/testify v1.8.4
	github.com/stvp/go-udp-testing v0.0.0-20191102171040-06b61409b154
	github.com/traefik/paerser v0.2.0
	github.com/traefik/yaegi v0.15.1
	github.com/uber/jaeger-client-go v2.30.0+incompatible
	github.com/uber/jaeger-lib v2.2.0+incompatible
	github.com/unrolled/render v1.0.2
	github.com/unrolled/secure v1.0.9
	github.com/vdemeester/shakers v0.1.0
	github.com/vulcand/oxy/v2 v2.0.0-20230417082832-03de175b3822
	github.com/vulcand/predicate v1.2.0
	go.elastic.co/apm v1.13.1
	go.elastic.co/apm/module/apmot v1.13.1
	golang.org/x/mod v0.14.0
	golang.org/x/net v0.20.0
	golang.org/x/text v0.14.0
	golang.org/x/time v0.3.0
	golang.org/x/tools v0.17.0
	google.golang.org/grpc v1.59.0
	gopkg.in/DataDog/dd-trace-go.v1 v1.43.1
	gopkg.in/fsnotify.v1 v1.4.7
	gopkg.in/yaml.v3 v3.0.1
	k8s.io/api v0.29.2
	k8s.io/apiextensions-apiserver v0.26.3
	k8s.io/apimachinery v0.29.2
	k8s.io/client-go v0.29.2
	k8s.io/utils v0.0.0-20230726121419-3b25d923346b
	mvdan.cc/xurls/v2 v2.1.0
	sigs.k8s.io/gateway-api v0.4.0
)

require (
	cloud.google.com/go/compute v1.23.1 // indirect
	cloud.google.com/go/compute/metadata v0.2.3 // indirect
	dario.cat/mergo v1.0.0 // indirect
	github.com/AdaLogics/go-fuzz-headers v0.0.0-20230811130428-ced1acdcaa24 // indirect
	github.com/AlecAivazis/survey/v2 v2.3.7 // indirect
	github.com/Azure/azure-sdk-for-go v40.3.0+incompatible // indirect
	github.com/Azure/go-ansiterm v0.0.0-20210617225240-d185dfc1b5a1 // indirect
	github.com/Azure/go-autorest v14.2.0+incompatible // indirect
	github.com/Azure/go-autorest/autorest v0.11.24 // indirect
	github.com/Azure/go-autorest/autorest/adal v0.9.18 // indirect
	github.com/Azure/go-autorest/autorest/azure/auth v0.5.11 // indirect
	github.com/Azure/go-autorest/autorest/azure/cli v0.4.5 // indirect
	github.com/Azure/go-autorest/autorest/date v0.3.0 // indirect
	github.com/Azure/go-autorest/autorest/to v0.4.0 // indirect
	github.com/Azure/go-autorest/autorest/validation v0.3.1 // indirect
	github.com/Azure/go-autorest/logger v0.2.1 // indirect
	github.com/Azure/go-autorest/tracing v0.6.0 // indirect
	github.com/DataDog/datadog-agent/pkg/obfuscate v0.0.0-20211129110424-6491aa3bf583 // indirect
	github.com/DataDog/datadog-go v4.8.2+incompatible // indirect
	github.com/DataDog/datadog-go/v5 v5.0.2 // indirect
	github.com/DataDog/sketches-go v1.2.1 // indirect
	github.com/HdrHistogram/hdrhistogram-go v1.1.2 // indirect
	github.com/Masterminds/goutils v1.1.1 // indirect
	github.com/Masterminds/semver/v3 v3.2.1 // indirect
	github.com/Microsoft/go-winio v0.6.1 // indirect
	github.com/Microsoft/hcsshim v0.11.4 // indirect
	github.com/OpenDNS/vegadns2client v0.0.0-20180418235048-a3fa4a771d87 // indirect
	github.com/Shopify/sarama v1.23.1 // indirect
	github.com/VividCortex/gohistogram v1.0.0 // indirect
	github.com/acarl005/stripansi v0.0.0-20180116102854-5a71ef0e047d // indirect
	github.com/akamai/AkamaiOPEN-edgegrid-golang v1.2.1 // indirect
	github.com/aliyun/alibaba-cloud-sdk-go v1.61.1755 // indirect
	github.com/andres-erbsen/clock v0.0.0-20160526145045-9e14626cd129 // indirect
	github.com/armon/go-metrics v0.3.10 // indirect
	github.com/armon/go-radix v1.0.0 // indirect
	github.com/aws/aws-sdk-go-v2 v1.24.1 // indirect
	github.com/aws/aws-sdk-go-v2/config v1.26.6 // indirect
	github.com/aws/aws-sdk-go-v2/credentials v1.16.16 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.14.11 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.2.10 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.5.10 // indirect
	github.com/aws/aws-sdk-go-v2/internal/ini v1.7.3 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.10.4 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.10.10 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.18.7 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.21.7 // indirect
	github.com/aws/aws-sdk-go-v2/service/sts v1.26.7 // indirect
	github.com/aws/smithy-go v1.19.0 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/boombuler/barcode v1.0.1-0.20190219062509-6c824513bacc // indirect
	github.com/buger/goterm v1.0.4 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/circonus-labs/circonus-gometrics v2.3.1+incompatible // indirect
	github.com/circonus-labs/circonusllhist v0.1.3 // indirect
	github.com/civo/civogo v0.3.11 // indirect
	github.com/cloudflare/cloudflare-go v0.49.0 // indirect
	github.com/compose-spec/compose-go/v2 v2.0.2 // indirect
	github.com/compose-spec/godotenv v1.0.0 // indirect
	github.com/containerd/console v1.0.4 // indirect
	github.com/containerd/containerd v1.7.13 // indirect
	github.com/containerd/continuity v0.4.3 // indirect
	github.com/containerd/log v0.1.0 // indirect
	github.com/containerd/ttrpc v1.2.2 // indirect
	github.com/containerd/typeurl/v2 v2.1.1 // indirect
	github.com/coreos/go-semver v0.3.1 // indirect
	github.com/coreos/go-systemd/v22 v22.5.0 // indirect
	github.com/cpu/goacmedns v0.1.1 // indirect
	github.com/deepmap/oapi-codegen v1.9.1 // indirect
	github.com/dgraph-io/ristretto v0.1.0 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/dimchansky/utfbom v1.1.1 // indirect
	github.com/distribution/distribution/v3 v3.0.0-20210316161203-a01c71e2477e // indirect
	github.com/distribution/reference v0.5.0 // indirect
	github.com/dnsimple/dnsimple-go v0.71.1 // indirect
	github.com/docker/buildx v0.13.1 // indirect
	github.com/docker/distribution v2.8.3+incompatible // indirect
	github.com/docker/docker-credential-helpers v0.8.0 // indirect
	github.com/docker/go v1.5.1-1.0.20160303222718-d30aec9fd63c // indirect
	github.com/docker/go-metrics v0.0.1 // indirect
	github.com/docker/go-units v0.5.0 // indirect
	github.com/donovanhide/eventsource v0.0.0-20170630084216-b8f31a59085e // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/eiannone/keyboard v0.0.0-20220611211555-0d226195f203 // indirect
	github.com/elastic/go-licenser v0.3.1 // indirect
	github.com/elastic/go-sysinfo v1.1.1 // indirect
	github.com/elastic/go-windows v1.0.0 // indirect
	github.com/emicklei/go-restful/v3 v3.11.0 // indirect
	github.com/evanphx/json-patch v4.12.0+incompatible // indirect
	github.com/exoscale/egoscale v0.90.0 // indirect
	github.com/fatih/color v1.13.0 // indirect
	github.com/felixge/httpsnoop v1.0.4 // indirect
	github.com/fsnotify/fsevents v0.1.1 // indirect
	github.com/fsnotify/fsnotify v1.7.0 // indirect
	github.com/fvbommel/sortorder v1.0.2 // indirect
	github.com/ghodss/yaml v1.0.0 // indirect
	github.com/go-errors/errors v1.0.1 // indirect
	github.com/go-jose/go-jose/v3 v3.0.0 // indirect
	github.com/go-logfmt/logfmt v0.5.1 // indirect
	github.com/go-logr/logr v1.3.0 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-openapi/jsonpointer v0.19.6 // indirect
	github.com/go-openapi/jsonreference v0.20.2 // indirect
	github.com/go-openapi/swag v0.22.3 // indirect
	github.com/go-redis/redis/v8 v8.11.5 // indirect
	github.com/go-resty/resty/v2 v2.1.1-0.20191201195748-d7b97669fe48 // indirect
	github.com/go-task/slim-sprig v0.0.0-20230315185526-52ccab3ef572 // indirect
	github.com/go-zookeeper/zk v1.0.3 // indirect
	github.com/gofrs/flock v0.8.1 // indirect
	github.com/gogo/googleapis v1.4.1 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang-jwt/jwt/v4 v4.5.0 // indirect
	github.com/golang/glog v1.1.2 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/golang/mock v1.6.0 // indirect
	github.com/google/btree v1.0.1 // indirect
	github.com/google/gnostic-models v0.6.8 // indirect
	github.com/google/go-cmp v0.6.0 // indirect
	github.com/google/go-querystring v1.1.0 // indirect
	github.com/google/gofuzz v1.2.0 // indirect
	github.com/google/pprof v0.0.0-20230323073829-e72429f035bd // indirect
	github.com/google/s2a-go v0.1.4 // indirect
	github.com/google/shlex v0.0.0-20191202100458-e7afc7fbc510 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/googleapis/enterprise-certificate-proxy v0.2.4 // indirect
	github.com/googleapis/gax-go/v2 v2.12.0 // indirect
	github.com/gophercloud/gophercloud v1.0.0 // indirect
	github.com/gophercloud/utils v0.0.0-20210216074907-f6de111f2eae // indirect
	github.com/gravitational/trace v1.1.16-0.20220114165159-14a9a7dd6aaf // indirect
	github.com/grpc-ecosystem/go-grpc-middleware v1.3.0 // indirect
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.16.0 // indirect
	github.com/hashicorp/consul/sdk v0.10.0 // indirect
	github.com/hashicorp/cronexpr v1.1.1 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-cleanhttp v0.5.2 // indirect
	github.com/hashicorp/go-immutable-radix v1.3.1 // indirect
	github.com/hashicorp/go-msgpack v0.5.5 // indirect
	github.com/hashicorp/go-retryablehttp v0.7.5 // indirect
	github.com/hashicorp/go-rootcerts v1.0.2 // indirect
	github.com/hashicorp/go-sockaddr v1.0.2 // indirect
	github.com/hashicorp/go-uuid v1.0.2 // indirect
	github.com/hashicorp/golang-lru v0.5.4 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/hashicorp/memberlist v0.3.1 // indirect
	github.com/hashicorp/raft v1.3.6 // indirect
	github.com/hashicorp/raft-autopilot v0.1.5 // indirect
	github.com/hashicorp/serf v0.9.7 // indirect
	github.com/hashicorp/yamux v0.0.0-20210826001029-26ff87cf9493 // indirect
	github.com/huandu/xstrings v1.3.3 // indirect
	github.com/iij/doapi v0.0.0-20190504054126-0bbf12d6d7df // indirect
	github.com/imdario/mergo v0.3.16 // indirect
	github.com/in-toto/in-toto-golang v0.5.0 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/influxdata/line-protocol v0.0.0-20200327222509-2487e7298839 // indirect
	github.com/infobloxopen/infoblox-go-client v1.1.1 // indirect
	github.com/jcchavezs/porto v0.1.0 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/joeshaw/multierror v0.0.0-20140124173710-69b34d4ec901 // indirect
	github.com/jonboulle/clockwork v0.4.0 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/k0kubun/go-ansi v0.0.0-20180517002512-3bf9e2903213 // indirect
	github.com/kballard/go-shellquote v0.0.0-20180428030007-95032a82bc51 // indirect
	github.com/kolo/xmlrpc v0.0.0-20200310150728-e0350524596b // indirect
	github.com/labbsr0x/bindman-dns-webhook v1.0.2 // indirect
	github.com/labbsr0x/goh v1.0.1 // indirect
	github.com/linode/linodego v1.9.1 // indirect
	github.com/liquidweb/go-lwApi v0.0.5 // indirect
	github.com/liquidweb/liquidweb-cli v0.6.9 // indirect
	github.com/liquidweb/liquidweb-go v1.6.3 // indirect
	github.com/looplab/fsm v0.1.0 // indirect
	github.com/mailgun/minheap v0.0.0-20170619185613-3dbe6c6bf55f // indirect
	github.com/mailgun/multibuf v0.1.2 // indirect
	github.com/mailgun/timetools v0.0.0-20141028012446-7e6055773c51 // indirect
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.17 // indirect
	github.com/mattn/go-runewidth v0.0.15 // indirect
	github.com/mattn/go-shellwords v1.0.12 // indirect
	github.com/matttproud/golang_protobuf_extensions v1.0.4 // indirect
	github.com/mgutz/ansi v0.0.0-20170206155736-9520e82c474b // indirect
	github.com/miekg/pkcs11 v1.1.1 // indirect
	github.com/mimuret/golang-iij-dpf v0.7.1 // indirect
	github.com/mitchellh/go-homedir v1.1.0 // indirect
	github.com/mitchellh/go-testing-interface v1.14.1 // indirect
	github.com/mitchellh/reflectwalk v1.0.2 // indirect
	github.com/moby/buildkit v0.13.1 // indirect
	github.com/moby/docker-image-spec v1.3.1 // indirect
	github.com/moby/locker v1.0.1 // indirect
	github.com/moby/patternmatcher v0.6.0 // indirect
	github.com/moby/spdystream v0.2.0 // indirect
	github.com/moby/sys/mountinfo v0.7.1 // indirect
	github.com/moby/sys/sequential v0.5.0 // indirect
	github.com/moby/sys/signal v0.7.0 // indirect
	github.com/moby/sys/symlink v0.2.0 // indirect
	github.com/moby/sys/user v0.1.0 // indirect
	github.com/moby/term v0.5.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/morikuni/aec v1.0.0 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/mxk/go-flowrate v0.0.0-20140419014527-cca7078d478f // indirect
	github.com/namedotcom/go v0.0.0-20180403034216-08470befbe04 // indirect
	github.com/nrdcg/auroradns v1.1.0 // indirect
	github.com/nrdcg/desec v0.6.0 // indirect
	github.com/nrdcg/dnspod-go v0.4.0 // indirect
	github.com/nrdcg/freemyip v0.2.0 // indirect
	github.com/nrdcg/goinwx v0.8.1 // indirect
	github.com/nrdcg/namesilo v0.2.1 // indirect
	github.com/nrdcg/porkbun v0.1.1 // indirect
	github.com/onsi/ginkgo/v2 v2.13.0 // indirect
	github.com/opencontainers/go-digest v1.0.0 // indirect
	github.com/opencontainers/image-spec v1.1.0-rc6 // indirect
	github.com/opentracing-contrib/go-observer v0.0.0-20170622124052-a52f23424492 // indirect
	github.com/oracle/oci-go-sdk v24.3.0+incompatible // indirect
	github.com/ovh/go-ovh v1.1.0 // indirect
	github.com/pelletier/go-toml v1.9.5 // indirect
	github.com/philhofer/fwd v1.1.1 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/pquerna/otp v1.3.0 // indirect
	github.com/prometheus/common v0.44.0 // indirect
	github.com/prometheus/procfs v0.12.0 // indirect
	github.com/quic-go/qpack v0.4.0 // indirect
	github.com/quic-go/qtls-go1-19 v0.2.1 // indirect
	github.com/quic-go/qtls-go1-20 v0.1.1 // indirect
	github.com/r3labs/sse v0.0.0-20210224172625-26fe804710bc // indirect
	github.com/rivo/uniseg v0.2.0 // indirect
	github.com/sacloud/api-client-go v0.2.1 // indirect
	github.com/sacloud/go-http v0.1.2 // indirect
	github.com/sacloud/iaas-api-go v1.3.2 // indirect
	github.com/sacloud/packages-go v0.0.5 // indirect
	github.com/santhosh-tekuri/jsonschema v1.2.4 // indirect
	github.com/scaleway/scaleway-sdk-go v1.0.0-beta.9 // indirect
	github.com/sean-/seed v0.0.0-20170313163322-e2103e2c3529 // indirect
	github.com/secure-systems-lab/go-securesystemslib v0.4.0 // indirect
	github.com/segmentio/fasthash v1.0.3 // indirect
	github.com/serialx/hashring v0.0.0-20200727003509-22c0c7ab6b1b // indirect
	github.com/shibumi/go-pathspec v1.3.0 // indirect
	github.com/shopspring/decimal v1.2.0 // indirect
	github.com/skratchdot/open-golang v0.0.0-20200116055534-eef842397966 // indirect
	github.com/smartystreets/go-aws-auth v0.0.0-20180515143844-0c1422d1fdb9 // indirect
	github.com/softlayer/softlayer-go v1.0.6 // indirect
	github.com/softlayer/xmlrpc v0.0.0-20200409220501-5f089df7cb7e // indirect
	github.com/spf13/cast v1.3.1 // indirect
	github.com/spf13/cobra v1.8.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/stretchr/objx v0.5.0 // indirect
	github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common v1.0.490 // indirect
	github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/dnspod v1.0.490 // indirect
	github.com/theupdateframework/notary v0.7.0 // indirect
	github.com/tilt-dev/fsnotify v1.4.8-0.20220602155310-fff9c274a375 // indirect
	github.com/tinylib/msgp v1.1.2 // indirect
	github.com/tonistiigi/fsutil v0.0.0-20240301111122-7525a1af2bb5 // indirect
	github.com/tonistiigi/units v0.0.0-20180711220420-6950e57a87ea // indirect
	github.com/tonistiigi/vt100 v0.0.0-20230623042737-f9a4f7ef6531 // indirect
	github.com/transip/gotransip/v6 v6.17.0 // indirect
	github.com/tv42/httpunix v0.0.0-20150427012821-b75d8614f926 // indirect
	github.com/ultradns/ultradns-go-sdk v1.4.0-20221107152238-f3f1d1d // indirect
	github.com/vinyldns/go-vinyldns v0.9.16 // indirect
	github.com/vultr/govultr/v2 v2.17.2 // indirect
	github.com/xeipuuv/gojsonpointer v0.0.0-20190905194746-02993c407bfb // indirect
	github.com/xeipuuv/gojsonreference v0.0.0-20180127040603-bd5ef7bd5415 // indirect
	github.com/xeipuuv/gojsonschema v1.2.0 // indirect
	github.com/yandex-cloud/go-genproto v0.0.0-20220805142335-27b56ddae16f // indirect
	github.com/yandex-cloud/go-sdk v0.0.0-20220805164847-cf028e604997 // indirect
	go.elastic.co/apm/module/apmhttp v1.13.1 // indirect
	go.elastic.co/fastjson v1.1.0 // indirect
	go.etcd.io/etcd/api/v3 v3.5.10 // indirect
	go.etcd.io/etcd/client/pkg/v3 v3.5.10 // indirect
	go.etcd.io/etcd/client/v3 v3.5.10 // indirect
	go.opencensus.io v0.24.0 // indirect
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.46.1 // indirect
	go.opentelemetry.io/contrib/instrumentation/net/http/httptrace/otelhttptrace v0.46.1 // indirect
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.46.1 // indirect
	go.opentelemetry.io/otel v1.21.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlpmetric v0.42.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc v0.42.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp v0.42.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace v1.21.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.21.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp v1.21.0 // indirect
	go.opentelemetry.io/otel/exporters/prometheus v0.42.0 // indirect
	go.opentelemetry.io/otel/metric v1.21.0 // indirect
	go.opentelemetry.io/otel/sdk v1.21.0 // indirect
	go.opentelemetry.io/otel/sdk/metric v1.21.0 // indirect
	go.opentelemetry.io/otel/trace v1.21.0 // indirect
	go.opentelemetry.io/proto/otlp v1.0.0 // indirect
	go.uber.org/atomic v1.10.0 // indirect
	go.uber.org/mock v0.4.0 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	go.uber.org/ratelimit v0.2.0 // indirect
	go.uber.org/zap v1.19.0 // indirect
	go4.org/intern v0.0.0-20211027215823-ae77deb06f29 // indirect
	go4.org/unsafe/assume-no-moving-gc v0.0.0-20220617031537-928513b29760 // indirect
	golang.org/x/crypto v0.18.0 // indirect
	golang.org/x/exp v0.0.0-20240112132812-db7319d0e0e3 // indirect
	golang.org/x/lint v0.0.0-20210508222113-6edffad5e616 // indirect
	golang.org/x/oauth2 v0.11.0 // indirect
	golang.org/x/sync v0.6.0 // indirect
	golang.org/x/sys v0.16.0 // indirect
	golang.org/x/term v0.16.0 // indirect
	golang.org/x/xerrors v0.0.0-20220907171357-04be3eba64a2 // indirect
	google.golang.org/api v0.128.0 // indirect
	google.golang.org/appengine v1.6.7 // indirect
	google.golang.org/genproto v0.0.0-20231016165738-49dd2c1f3d0b // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20231016165738-49dd2c1f3d0b // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20231016165738-49dd2c1f3d0b // indirect
	google.golang.org/protobuf v1.31.0 // indirect
	gopkg.in/cenkalti/backoff.v1 v1.1.0 // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/ini.v1 v1.66.6 // indirect
	gopkg.in/ns1/ns1-go.v2 v2.6.5 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	howett.net/plist v0.0.0-20181124034731-591f970eefbb // indirect
	inet.af/netaddr v0.0.0-20220617031823-097006376321 // indirect
	k8s.io/apiserver v0.29.2 // indirect
	k8s.io/klog/v2 v2.110.1 // indirect
	k8s.io/kube-openapi v0.0.0-20231010175941-2dd684a91f00 // indirect
	sigs.k8s.io/json v0.0.0-20221116044647-bc3834ca7abd // indirect
	sigs.k8s.io/structured-merge-diff/v4 v4.4.1 // indirect
	sigs.k8s.io/yaml v1.3.0 // indirect
	tags.cncf.io/container-device-interface v0.6.2 // indirect
)

// Containous forks
replace (
	github.com/abbot/go-http-auth => github.com/containous/go-http-auth v0.4.1-0.20200324110947-a37a7636d23e
	github.com/go-check/check => github.com/containous/check v0.0.0-20170915194414-ca0bf163426a
	github.com/gorilla/mux => github.com/containous/mux v0.0.0-20220627093034-b2dd784e613f
	github.com/mailgun/minheap => github.com/containous/minheap v0.0.0-20190809180810-6e71eb837595
)

// https://github.com/docker/compose/blob/e44222664abd07ce1d1fe6796d84d93cbc7468c3/go.mod#L131
replace github.com/jaguilar/vt100 => github.com/tonistiigi/vt100 v0.0.0-20190402012908-ad4c4a574305

// ambiguous import: found package github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/http in multiple modules
// tencentcloud uses monorepo with multimodule but the go.mod files are incomplete.
exclude github.com/tencentcloud/tencentcloud-sdk-go v3.0.83+incompatible
