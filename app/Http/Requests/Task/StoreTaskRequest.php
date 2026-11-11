<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
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
        if ($this->has('title') && is_string($this->input('title'))) {
            $this->merge([
                'title' => trim($this->input('title')),
            ]);
        }

        if ($this->has('description') && is_string($this->input('description'))) {
            $trimmed = trim($this->input('description'));
            $this->merge([
                'description' => $trimmed === '' ? null : $trimmed,
            ]);
        }

        if ($this->has('due_at') && $this->input('due_at') === '') {
            $this->merge([
                'due_at' => null,
            ]);
        }

        if (! $this->has('status') || $this->input('status') === '') {
            $this->merge([
                'status' => TaskStatus::Todo->value,
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'string', Rule::enum(TaskStatus::class)],
            'due_at' => ['nullable', 'date'],
        ];
    }
}
