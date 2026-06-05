import { SubmitProblemForm } from '@/features/problems/ui/submit-problem';
import type { ProblemDocumentAutoFillControls } from '@/features/problems/ui/submit-problem/SubmitProblemForm';
import { useSearch } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '@/shared/config/paths';
import { DocumentAutoFillControl } from '@/shared/ui/document-auto-fill-control';
import { CreationPageTemplate } from '@/shared/ui/pages/CreationPageTemplate';

const SUBMIT_PROBLEM_QUOTE =
  '\u201cCertainty of purpose is the starting point of all achievement\u201d \u2014 W. Clement Stone.';

export function SubmitProblemPage() {
  const { problemId } = useSearch({ from: '/_auth/problems/new' });
  const [documentAutoFillControls, setDocumentAutoFillControls] =
    useState<ProblemDocumentAutoFillControls | null>(null);

  return (
    <CreationPageTemplate
      title={problemId ? 'Edit Problem' : 'Submit Problem'}
      quote={SUBMIT_PROBLEM_QUOTE}
      backTo={problemId ? ROUTES.problemDetail(problemId) : undefined}
      loadingOverlay={documentAutoFillControls?.isScanning}
      loadingMessage="Scanning document and populating fields…"
      headerAction={
        documentAutoFillControls ? (
          <DocumentAutoFillControl
            disabled={documentAutoFillControls.disabled}
            isScanning={documentAutoFillControls.isScanning}
            onFileSelected={documentAutoFillControls.handleFileSelected}
          />
        ) : null
      }
    >
      <SubmitProblemForm
        onDocumentAutoFillControlsChange={setDocumentAutoFillControls}
      />
    </CreationPageTemplate>
  );
}
