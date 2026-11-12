<?php

namespace App\Http\Requests\Invitation;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvitationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('mode')) {
            $this->merge([
                'mode' => 'account_id',
            ]);
        }

        if ($this->has('account_id') && (is_string($this->input('account_id')) || is_numeric($this->input('account_id')))) {
            $cleanAccountId = trim((string) $this->input('account_id'));

            $this->merge([
                'account_id' => $cleanAccountId,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', Rule::in(['account_id', 'code'])],
            'account_id' => [
                'nullable',
                'required_if:mode,account_id',
                'string',
                'regex:/^[1-9][0-9]{8}$/',
                Rule::exists('users', 'account_id'),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'account_id.required_if' => 'Account ID is required to send an invitation.',
            'account_id.regex' => 'Account ID must be a 9-digit numeric identifier.',
            'account_id.exists' => 'No account was found with that Account ID.',
        ];
    }
}
