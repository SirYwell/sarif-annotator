import * as core from '@actions/core'
import {Converter, Output} from './converter'
import {context, getOctokit} from '@actions/github'
// eslint-disable-next-line import/no-unresolved
import {Log} from 'sarif'
import {QodanaConverter} from './qodana-converter'
import {getInput} from '@actions/core'

const name = 'SARIF Annotator'

function createConverter(): Converter {
  switch (getInput('source').toLowerCase()) {
    case 'qodana':
      return new QodanaConverter()
    default:
      return new Converter()
  }
}

async function publishOutput(output: Output): Promise<void> {
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
  const exists = result.data.check_runs.filter(check => check.name === name).length > 0
  if (exists) {
    await octokit.rest.checks.create({
      ...context.repo,
      head_sha: sha,
      conclusion: 'failure', // TODO
      name,
      status: 'completed',
      output
    })
    // eslint-disable-next-line no-empty
  } else {
  }
}

async function run(): Promise<void> {
  try {
    const converter = createConverter()
    const log: Log = JSON.parse('')
    const output = converter.convert(log)
    await publishOutput(output)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
