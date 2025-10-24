// Regex pour la validation des suggestions
export const SUGGESTION_REGEX = {
  title: /^[a-zA-ZÀ-ÿ0-9\s\-'.,:;!?()]{3,100}$/,
  description: /^[\s\S]{10,1000}$/,
  stepsToReproduce: /^[\s\S]{10,500}$/
};

export const SUGGESTION_ERRORS = {
  title: {
    required: 'Le titre est requis',
    invalid: 'Le titre doit contenir entre 3 et 100 caractères (lettres, chiffres, espaces et ponctuation basique)',
    tooShort: 'Le titre doit contenir au moins 3 caractères',
    tooLong: 'Le titre ne peut pas dépasser 100 caractères'
  },
  description: {
    required: 'La description est requise',
    invalid: 'La description doit contenir entre 10 et 1000 caractères',
    tooShort: 'La description doit contenir au moins 10 caractères',
    tooLong: 'La description ne peut pas dépasser 1000 caractères'
  },
  stepsToReproduce: {
    required: 'Les étapes pour reproduire sont requises pour un bug',
    invalid: 'Les étapes doivent contenir entre 10 et 500 caractères',
    tooShort: 'Les étapes doivent contenir au moins 10 caractères',
    tooLong: 'Les étapes ne peuvent pas dépasser 500 caractères'
  },
  severity: {
    required: 'La sévérité est requise pour un bug',
    invalid: 'La sévérité doit être: low, medium, high ou critical'
  }
};

/**
 * Valide le titre d'une suggestion
 */
export function validateTitle(title) {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: SUGGESTION_ERRORS.title.required };
  }
  
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length < 3) {
    return { valid: false, error: SUGGESTION_ERRORS.title.tooShort };
  }
  
  if (trimmedTitle.length > 100) {
    return { valid: false, error: SUGGESTION_ERRORS.title.tooLong };
  }
  
  if (!SUGGESTION_REGEX.title.test(trimmedTitle)) {
    return { valid: false, error: SUGGESTION_ERRORS.title.invalid };
  }
  
  return { valid: true, error: null };
}

/**
 * Valide la description d'une suggestion
 */
export function validateDescription(description) {
  if (!description || description.trim().length === 0) {
    return { valid: false, error: SUGGESTION_ERRORS.description.required };
  }
  
  const trimmedDescription = description.trim();
  
  if (trimmedDescription.length < 10) {
    return { valid: false, error: SUGGESTION_ERRORS.description.tooShort };
  }
  
  if (trimmedDescription.length > 1000) {
    return { valid: false, error: SUGGESTION_ERRORS.description.tooLong };
  }
  
  if (!SUGGESTION_REGEX.description.test(trimmedDescription)) {
    return { valid: false, error: SUGGESTION_ERRORS.description.invalid };
  }
  
  return { valid: true, error: null };
}

/**
 * Valide les étapes pour reproduire un bug
 */
export function validateStepsToReproduce(steps, isRequired = false) {
  if (!steps || steps.trim().length === 0) {
    if (isRequired) {
      return { valid: false, error: SUGGESTION_ERRORS.stepsToReproduce.required };
    }
    return { valid: true, error: null };
  }
  
  const trimmedSteps = steps.trim();
  
  if (trimmedSteps.length < 10) {
    return { valid: false, error: SUGGESTION_ERRORS.stepsToReproduce.tooShort };
  }
  
  if (trimmedSteps.length > 500) {
    return { valid: false, error: SUGGESTION_ERRORS.stepsToReproduce.tooLong };
  }
  
  if (!SUGGESTION_REGEX.stepsToReproduce.test(trimmedSteps)) {
    return { valid: false, error: SUGGESTION_ERRORS.stepsToReproduce.invalid };
  }
  
  return { valid: true, error: null };
}

/**
 * Valide la sévérité d'un bug
 */
export function validateSeverity(severity, isRequired = false) {
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  
  if (!severity) {
    if (isRequired) {
      return { valid: false, error: SUGGESTION_ERRORS.severity.required };
    }
    return { valid: true, error: null };
  }
  
  if (!validSeverities.includes(severity)) {
    return { valid: false, error: SUGGESTION_ERRORS.severity.invalid };
  }
  
  return { valid: true, error: null };
}

/**
 * Valide un formulaire de suggestion complet
 */
export function validateSuggestionForm(formData, type) {
  const errors = {};
  
  // Validation du titre
  const titleValidation = validateTitle(formData.title);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error;
  }
  
  // Validation de la description
  const descriptionValidation = validateDescription(formData.description);
  if (!descriptionValidation.valid) {
    errors.description = descriptionValidation.error;
  }
  
  // Validation spécifique aux bugs
  if (type === 'bug') {
    const stepsValidation = validateStepsToReproduce(formData.stepsToReproduce, true);
    if (!stepsValidation.valid) {
      errors.stepsToReproduce = stepsValidation.error;
    }
    
    const severityValidation = validateSeverity(formData.severity, true);
    if (!severityValidation.valid) {
      errors.severity = severityValidation.error;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
