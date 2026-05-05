import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { trace } from '@opentelemetry/api'

console.log('Initializing SigNoz OpenTelemetry Tracing...')

const exporter = new OTLPTraceExporter({
  url: '/otlp/v1/traces',
})

const provider = new WebTracerProvider({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: 'energyTwin',
    [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'iiot',
  }),
  spanProcessors: [
    new SimpleSpanProcessor(exporter),
    new BatchSpanProcessor(exporter),
  ],
})

provider.register({
  contextManager: new ZoneContextManager(),
})

registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation(),
    new XMLHttpRequestInstrumentation(),
  ],
})

// Test span
const tracer = trace.getTracer('signoz-check')
const span = tracer.startSpan('signoz-connection-test')

// Connectivity check
fetch('/otlp/v1/traces', {
  method: 'POST',
  body: JSON.stringify({}),
  headers: { 'Content-Type': 'application/json' }
}).then(response => {
  if (response.ok || response.status === 400) {
    console.log('✅ SigNoz Collector is REACHABLE (via proxy)');
  } else {
    console.warn('⚠️ SigNoz Collector returned status:', response.status);
  }
}).catch(err => {
  console.error('❌ SigNoz Collector is UNREACHABLE:', err.message);
});

setTimeout(() => {
  span.end()
  console.log('SigNoz Tracing Initialized: Test span sent.')
}, 1000)