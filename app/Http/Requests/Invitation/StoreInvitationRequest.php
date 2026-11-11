<?php

namespace App\Http\Requests\Invitation;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
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
                'mode' => 'username',
            ]);
        }

        if ($this->has('username') && is_string($this->input('username'))) {
            $cleanUsername = ltrim(trim($this->input('username')), '@');

            $this->merge([
                'username' => Str::lower($cleanUsername),
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
            'mode' => ['required', 'string', Rule::in(['username', 'code'])],
            'username' => [
                'nullable',
                'required_if:mode,username',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9_-]+$/',
                Rule::exists('users', 'username'),
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
            'username.exists' => 'No account was found with that username.',
        ];
    }
}
