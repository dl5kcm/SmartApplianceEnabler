import {AfterViewChecked, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlContainer, FormGroup, FormGroupDirective, Validators} from '@angular/forms';
import {ErrorMessages} from '../shared/error-messages';
import {ErrorMessageHandler} from '../shared/error-message-handler';
import {FormHandler} from '../shared/form-handler';
import {Logger} from '../log/logger';
import {ModbusRegisterConfguration} from '../shared/modbus-register-confguration';
import {TranslateService} from '@ngx-translate/core';
import {NestedFormService} from '../shared/nested-form-service';
import {InputValidatorPatterns} from '../shared/input-validator-patterns';
import {ErrorMessage, ValidatorType} from '../shared/error-message';

@Component({
  selector: 'app-modbus-register',
  templateUrl: './modbus-register.component.html',
  styleUrls: ['../global.css'],
  viewProviders: [
    {provide: ControlContainer, useExisting: FormGroupDirective}
  ]
})
export class ModbusRegisterComponent implements OnInit, AfterViewChecked, OnDestroy {

  @Input()
  register: ModbusRegisterConfguration;
  @Input()
  valueNames: string[];
  @Input()
  valueNameTextKeys: string[];
  @Input()
  readRegisterTypes: string[];
  @Input()
  writeRegisterTypes: string[];
  @Input()
  hideValueField: boolean;
  @Input()
  isReadOnly: boolean;
  @Input()
  translationPrefix: string;
  @Input()
  translationKeys: string[];
  translatedStrings: string[];
  errors: { [key: string]: string } = {};
  errorMessages: ErrorMessages;
  errorMessageHandler: ErrorMessageHandler;
  @Input()
  formControlNamePrefix = '';
  formHandler: FormHandler;
  form: FormGroup;

  constructor(private logger: Logger,
              private parent: FormGroupDirective,
              private nestedFormService: NestedFormService,
              private translate: TranslateService
  ) {
    this.errorMessageHandler = new ErrorMessageHandler(logger);
    this.formHandler = new FormHandler();
  }

  ngOnInit() {
    this.errorMessages = new ErrorMessages('ModbusRegisterComponent.error.', [
      new ErrorMessage('powerRegisterAddress', ValidatorType.required, 'registerAddress'),
      new ErrorMessage('powerRegisterAddress', ValidatorType.pattern, 'registerAddress'),
      new ErrorMessage('energyRegisterAddress', ValidatorType.required, 'registerAddress'),
      new ErrorMessage('energyRegisterAddress', ValidatorType.pattern, 'registerAddress'),
    ], this.translate);
    this.form = this.parent.form;
    this.expandParentForm(this.register);
    this.nestedFormService.submitted.subscribe(() => this.updateModelFromForm(this.form, this.register));
    this.translate.get(this.translationKeys).subscribe(translatedStrings => {
      this.translatedStrings = translatedStrings;
    });
    this.form.statusChanges.subscribe(() => {
      this.errors = this.errorMessageHandler.applyErrorMessages4ReactiveForm(this.form, this.errorMessages);
    });
  }

  ngAfterViewChecked() {
    this.formHandler.markLabelsRequired();
  }

  ngOnDestroy() {
    // FIXME: erzeugt Fehler bei Wechsel des Zählertypes
    // this.nestedFormService.submitted.unsubscribe();
  }

  expandParentForm(register: ModbusRegisterConfguration) {
    this.formHandler.addFormControl(this.form, this.getFormControlName('enabled'),
      register !== undefined ? true : false);
    this.formHandler.addFormControl(this.form, this.getFormControlName('name'),
      register ? register.name : undefined);
    this.formHandler.addFormControl(this.form, this.getFormControlName('registerAddress'),
      register ? register.address : undefined,
      [Validators.required, Validators.pattern(InputValidatorPatterns.INTEGER_OR_HEX)]);
    this.formHandler.addFormControl(this.form, this.getFormControlName('write'),
      register ? register.write : undefined);
    this.formHandler.addFormControl(this.form, this.getFormControlName('registerType'),
      register ? register.type : undefined);
    this.formHandler.addFormControl(this.form, this.getFormControlName('bytes'),
      register ? register.bytes : undefined);
    this.formHandler.addFormControl(this.form, this.getFormControlName('byteOrder'),
      register ? register.byteOrder : undefined);
    this.formHandler.addFormControl(this.form, this.getFormControlName('extractionRegex'),
      register ? register.extractionRegex : undefined);
    this.formHandler.addFormControl(this.form, this.getFormControlName('value'),
      register ? register.value : undefined);
    this.formHandler.addFormControl(this.form, this.getFormControlName('factorToValue'),
      register ? register.factorToValue : undefined);
  }

  updateModelFromForm(form: FormGroup, register: ModbusRegisterConfguration) {
    register.name = form.controls[this.getFormControlName('name')].value;
    register.address = form.controls[this.getFormControlName('registerAddress')].value;
    register.write = form.controls[this.getFormControlName('write')].value;
    register.type = form.controls[this.getFormControlName('registerType')].value;
    register.bytes = form.controls[this.getFormControlName('bytes')].value;
    register.byteOrder = form.controls[this.getFormControlName('byteOrder')].value;
    register.extractionRegex = form.controls[this.getFormControlName('extractionRegex')].value;
    register.value = form.controls[this.getFormControlName('value')].value;
    register.factorToValue = form.controls[this.getFormControlName('factorToValue')].value;
    this.nestedFormService.complete();
  }

  getFormControlName(formControlName: string): string {
    return `${this.formControlNamePrefix}${formControlName.charAt(0).toUpperCase()}${formControlName.slice(1)}`;
  }

  getTranslatedValueName(valueName: string) {
    const textKey = `${this.translationPrefix}${valueName.toLowerCase()}`;
    return this.translatedStrings[textKey];
  }

  getIndexedErrorMessage(key: string, index: number): string {
    const indexedKey = key + '.' + index.toString();
    return this.errors[indexedKey];
  }

  get disabled() {
    return ! this.form.controls[this.getFormControlName('enabled')].value;
  }

  get selectedValueName() {
    return this.valueNames.length === 1 && this.valueNames[0];
  }

  getRegisterTypes(write: boolean): string[] {
    if (write) {
      return this.writeRegisterTypes;
    }
    return this.readRegisterTypes;
  }

  get registerType(): string {
    const typeControl = this.form.controls[this.getFormControlName('registerType')];
    return (typeControl ? typeControl.value : '');
  }

  get isWriteRegister(): boolean {
    const writeControl = this.form.controls[this.getFormControlName('write')];
    return (writeControl ? writeControl.value : false);
  }

  getByteOrders(): string[] {
    return ['BigEndian', 'LittleEndian'];
  }
}