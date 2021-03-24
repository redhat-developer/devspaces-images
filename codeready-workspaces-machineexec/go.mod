module github.com/eclipse-che/che-machine-exec

go 1.12

replace (
	github.com/davecgh/go-spew => github.com/davecgh/go-spew v1.1.0
	github.com/docker/spdystream => github.com/docker/spdystream v0.0.0-20160310174837-449fdfce4d96
	github.com/eclipse/che-go-jsonrpc => github.com/eclipse/che-go-jsonrpc v0.0.0-20200317130110-931966b891fe
	github.com/ghodss/yaml => github.com/ghodss/yaml v0.0.0-20150909031657-73d445a93680
	github.com/gin-contrib/sse => github.com/gin-contrib/sse v0.0.0-20170109093832-22d885f9ecc7
	github.com/gin-gonic/gin => github.com/gin-gonic/gin v0.0.0-20180501062418-bd4f73af679e
	github.com/gogo/protobuf => github.com/gogo/protobuf v0.0.0-20170330071051-c0656edd0d9e
	github.com/golang/glog => github.com/golang/glog v0.0.0-20141105023935-44145f04b68c
	github.com/golang/protobuf => github.com/golang/protobuf v1.2.0
	github.com/google/gofuzz => github.com/google/gofuzz v0.0.0-20161122191042-44d81051d367
	github.com/googleapis/gnostic => github.com/googleapis/gnostic v0.0.0-20170729233727-0c5108395e2d
	github.com/gorilla/websocket => github.com/gorilla/websocket v0.0.0-20151102191034-361d4c0ffd78
	github.com/json-iterator/go => github.com/json-iterator/go v0.0.0-20180612202835-f2b4162afba3
	github.com/konsorten/go-windows-terminal-sequences => github.com/konsorten/go-windows-terminal-sequences v1.0.2
	github.com/mattn/go-isatty => github.com/mattn/go-isatty v0.0.3
	github.com/modern-go/concurrent => github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd
	github.com/modern-go/reflect2 => github.com/modern-go/reflect2 v0.0.0-20180320133207-05fbef0ca5da
	github.com/pkg/errors => github.com/pkg/errors v0.0.0-20161002052512-839d9e913e06
	github.com/pmezard/go-difflib => github.com/pmezard/go-difflib v1.0.0
	github.com/sirupsen/logrus => github.com/sirupsen/logrus v1.4.2
	github.com/spf13/pflag => github.com/spf13/pflag v1.0.1
	github.com/stretchr/objx => github.com/stretchr/objx v0.1.0
	github.com/stretchr/testify => github.com/stretchr/testify v1.2.1
	github.com/ugorji/go => github.com/ugorji/go v1.1.1
	golang.org/x/crypto => golang.org/x/crypto v0.0.0-20170825220121-81e90905daef
	golang.org/x/net => golang.org/x/net v0.0.0-20170809000501-1c05540f6879
	golang.org/x/sys => golang.org/x/sys v0.0.0-20171031081856-95c657629925
	golang.org/x/text => golang.org/x/text v0.0.0-20170810154203-b19bf474d317
	golang.org/x/time => golang.org/x/time v0.0.0-20161028155119-f51c12702a4d
	gopkg.in/go-playground/validator.v8 => gopkg.in/go-playground/validator.v8 v8.18.2
	gopkg.in/inf.v0 => gopkg.in/inf.v0 v0.9.0
	gopkg.in/yaml.v2 => gopkg.in/yaml.v2 v2.0.0-20170721113624-670d4cfef054
	k8s.io/api => k8s.io/api v0.0.0-20180713172427-0f11257a8a25
	k8s.io/apimachinery => k8s.io/apimachinery v0.0.0-20180619225948-e386b2658ed2
	k8s.io/client-go => k8s.io/client-go v0.0.0-20180817174322-745ca8300397
)

require (
	github.com/docker/spdystream v0.0.0-00010101000000-000000000000 // indirect
	github.com/eclipse/che-go-jsonrpc v0.0.0-00010101000000-000000000000
	github.com/elazarl/goproxy v0.0.0-20200426045556-49ad98f6dac1 // indirect
	github.com/ghodss/yaml v0.0.0-00010101000000-000000000000 // indirect
	github.com/gin-contrib/sse v0.0.0-00010101000000-000000000000 // indirect
	github.com/gin-gonic/gin v0.0.0-00010101000000-000000000000
	github.com/gogo/protobuf v0.0.0-00010101000000-000000000000 // indirect
	github.com/golang/glog v0.0.0-00010101000000-000000000000 // indirect
	github.com/golang/protobuf v0.0.0-00010101000000-000000000000 // indirect
	github.com/google/gofuzz v0.0.0-00010101000000-000000000000 // indirect
	github.com/googleapis/gnostic v0.0.0-00010101000000-000000000000 // indirect
	github.com/gorilla/websocket v0.0.0-00010101000000-000000000000
	github.com/json-iterator/go v0.0.0-00010101000000-000000000000 // indirect
	github.com/mattn/go-isatty v0.0.0-00010101000000-000000000000 // indirect
	github.com/modern-go/concurrent v0.0.0-00010101000000-000000000000 // indirect
	github.com/modern-go/reflect2 v0.0.0-00010101000000-000000000000 // indirect
	github.com/niemeyer/pretty v0.0.0-20200227124842-a10e7caefd8e // indirect
	github.com/pkg/errors v0.0.0-00010101000000-000000000000
	github.com/sirupsen/logrus v0.0.0-00010101000000-000000000000
	github.com/spf13/pflag v0.0.0-00010101000000-000000000000 // indirect
	github.com/stretchr/testify v1.2.2
	github.com/ugorji/go v0.0.0-00010101000000-000000000000 // indirect
	golang.org/x/crypto v0.0.0-00010101000000-000000000000 // indirect
	golang.org/x/net v0.0.0-00010101000000-000000000000 // indirect
	golang.org/x/sync v0.0.0-20200317015054-43a5402ce75a // indirect
	golang.org/x/text v0.0.0-00010101000000-000000000000 // indirect
	golang.org/x/time v0.0.0-00010101000000-000000000000 // indirect
	gopkg.in/check.v1 v1.0.0-20200227125254-8fa46927fb4f // indirect
	gopkg.in/go-playground/assert.v1 v1.2.1 // indirect
	gopkg.in/go-playground/validator.v8 v8.0.0-00010101000000-000000000000 // indirect
	gopkg.in/inf.v0 v0.0.0-00010101000000-000000000000 // indirect
	gopkg.in/yaml.v2 v2.0.0-00010101000000-000000000000
	k8s.io/api v0.0.0-00010101000000-000000000000
	k8s.io/apimachinery v0.0.0-00010101000000-000000000000
	k8s.io/client-go v0.0.0-00010101000000-000000000000
)
