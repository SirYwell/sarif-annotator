import {Log} from 'sarif'

export class Converter {
  convert(log: Log): Output {
    return {
      title: this.createTitle(log),
      summary: this.createSummary(log),
      text: this.createText(log),
      annotations: this.createAnnotations(log)
    }
  }

  // I don't know why the linter cries here???
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createTitle(log: Log): string {
    return 'SARIF Report'
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createSummary(log: Log): string {
    return ''
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createText(log: Log): string | null {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createAnnotations(log: Log): Annotation[] | null {
    return null
  }
}

export type AnnotationLevel = 'notice' | 'warning' | 'failure'

export interface Annotation {
  path: string
  start_line: number
  end_line: number
  start_column: number | undefined
  end_column: number | undefined
  annotation_level: AnnotationLevel
  message: string
  title?: string
  raw_details?: string
  // actions, not supported by us
}

export interface Output {
  title: string
  summary: string
  text?: string | null
  annotations?: Annotation[] | null
}
