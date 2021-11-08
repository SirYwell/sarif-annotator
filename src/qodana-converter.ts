import {Annotation, AnnotationLevel, Converter} from './converter'
// eslint-disable-next-line import/no-unresolved
import {Log, Result} from 'sarif'

export class QodanaConverter extends Converter {
  createTitle(log: Log): string {
    return log.runs[0].results?.length ? 'Problems detected!' : 'Everything is fine!'
  }

  createSummary(log: Log): string {
    // As of now, Qodana only generates files with one run
    return `Qodana detected ${log.runs[0].results?.length} problem(s)`
  }

  createText(log: Log): string | null {
    return super.createText(log)
  }

  createAnnotations(log: Log): Annotation[] | null {
    if (!log.runs[0].results) {
      return null
    }
    return log.runs[0].results.map(result => createAnnotation(result)).filter(notEmpty)
  }
}

function createAnnotation(result: Result): Annotation | null {
  if (!result.locations) {
    return null
  }
  const physLoc = result.locations[0].physicalLocation
  if (
    !physLoc ||
    !physLoc.region ||
    !physLoc.region.startLine ||
    !physLoc.artifactLocation ||
    !physLoc.artifactLocation.uri
  ) {
    return null
  }

  const level = convertLevel(result.level)
  return {
    path: physLoc.artifactLocation.uri,
    start_line: physLoc.region.startLine,
    end_line: physLoc.region.endLine ? physLoc.region.endLine : physLoc.region.startLine,
    // annotations only support columns in one line
    start_column:
      physLoc.region.startLine === physLoc.region.endColumn
        ? physLoc.region.startColumn
        : undefined,
    end_column:
      physLoc.region.startLine === physLoc.region.endColumn ? physLoc.region.endColumn : undefined,
    annotation_level: level,
    message: result.message.text ?? result.message.markdown ?? '',
    title: result.ruleId
  }
}

function convertLevel(l: string | undefined): AnnotationLevel {
  let level: AnnotationLevel = 'notice'
  switch (l) {
    case 'error':
      level = 'failure'
      break
    case 'none':
    case 'note':
      level = 'notice'
      break
    case 'warning':
      level = 'warning'
      break
  }
  return level
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}
