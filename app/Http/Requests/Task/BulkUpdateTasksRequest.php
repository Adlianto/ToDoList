<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkUpdateTasksRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'updates' => ['required', 'array', 'min:1', 'max:100'],
            'updates.*.task_id' => ['required', 'integer', 'min:1'],
            'updates.*.status' => ['required', 'string', Rule::enum(TaskStatus::class)],
        ];
    }
}
