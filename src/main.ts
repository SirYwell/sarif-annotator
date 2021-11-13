import * as core from '@actions/core'
import * as fs from 'fs'
import {Converter, ConverterConfig, Output} from './converter'
import {context, getOctokit} from '@actions/github'
import BufferEncoding from 'buffer'
// eslint-disable-next-line import/no-unresolved
import {Log} from 'sarif'
import {QodanaConverter} from './qodana-converter'
import {getInput} from '@actions/core'
import {splitEvery} from 'ramda'

const MAX_ANNOTATIONS_PER_REQUEST = 50

type Conclusion =
  | 'action_required'
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'success'
  | 'skipped'
  | 'stale' // not settable via API, just for completeness
  | 'timed_out'

export type BaselineState = 'new' | 'unchanged' | 'updated' | 'absent'

function createConverter(config: ConverterConfig): Converter {
  switch (getInput('source').toLowerCase()) {
    case 'qodana':
      core.info('using QodanaConverter')
      return new QodanaConverter(config)
    default:
      core.warning(`no matching converter found. Falling back.`)
      return new Converter(config)
  }
}

async function publishOutput(output: Output, conclusion: Conclusion): Promise<void> {
  core.info('publishing output')
  const octokit = getOctokit(getInput('token'))
  let sha = context.sha
  if (context.payload.pull_request) {
    sha = context.payload.pull_request.head.sha
  }
  const request = {
    ...context.repo,
    ref: sha
  }

  const result = await octokit.rest.checks.listForRef(request)
  const exists = result.data.check_runs.find(check => check.name === output.title)
  const accept = 'application/vnd.github.v3+json'
  if (exists) {
    core.info('check exists, reusing...')
    const id = exists.id
    await octokit.rest.checks.update({
      ...context.repo,
      accept,
      conclusion,
      check_run_id: id,
      status: 'completed',
      output
    })
  } else {
    core.info('check does not exist, creating new...')
    const createRequest = {
      ...context.repo,
      accept,
      head_sha: sha,
      conclusion,
      name: output.title,
      status: 'completed',
      output
    }
    await octokit.rest.checks.create(createRequest)
  }
}

function calcConclusion(output: Output): Conclusion {
  const s = new Set(output.annotations.map(a => a.annotation_level))
  if (s.has('failure') || s.has('warning')) {
    return 'failure'
  }
  if (s.has('notice')) {
    return 'neutral'
  }
  return 'success'
}

async function run(): Promise<void> {
  try {
    const config = {
      baselineStates: getInput('baseline-state-filter')
        .split(',')
        .filter((s): s is BaselineState => s !== undefined)
    }
    core.info(`Using config: ${JSON.stringify(config)}`)
    const converter = createConverter(config)
    const path = getInput('report-path')
    core.info(`read sarif log from path '${path}'`)
    const log: Log = JSON.parse(fs.readFileSync(path, 'UTF-8' as BufferEncoding))
    // we need to split annotations into groups
    // but as we're lazy, we just mutate the output object
    const output = converter.convert(log)
    const conclusion = calcConclusion(output)
    for (const group of splitEvery(MAX_ANNOTATIONS_PER_REQUEST, output.annotations)) {
      output.annotations = group
      await publishOutput(output, conclusion)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
