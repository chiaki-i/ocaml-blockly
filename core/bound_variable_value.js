/**
 * @fileoverview The class representing a variable declared in block.
 * This class is expected to be used in a typedVersion workspace.
 */
'use strict';

goog.provide('Blockly.BoundVariableValue');

goog.require('goog.string');


/**
 * Class for a variable declared in the block.
 * @param {!Blockly.Block} block The block the variable is declared in.
 * @param {!Blockly.TypeExpr} typeExpr The type expression of the variable.
 * @param {!string} fieldName The name of the variable field.
 * @param {!string} scopeInputName The name of the input where the variable can
 *     be referred to.
 * @param {!string} variableName The default name of this variable value.
 * @constructor
 */
Blockly.BoundVariableValue = function(block, typeExpr, fieldName,
    scopeInputName, variableName) {
  /**
   * The block the variable is declared in.
   * @type {!Blockly.Block}
   */
  this.sourceBlock_ = block;

  /**
   * The workspace of this variable's block.
   * @type {!Blockly.Workspace}
   */
  this.workspace_ = this.sourceBlock_.workspace;

  /**
   * @type {!Blockly.TypeExpr} The type expression of the variable.
   */
  this.typeExpr = typeExpr;

  /**
   * The name of the variable field which belongs to the block.
   * @type {!string}
   */
  this.fieldName = fieldName;

  /**
   * The name of input which this variable can be used. (e.g. Suppose that the
   * source block is 'let X = I1 in I2' where I1 and I2 is value inputs.
   * this.inputName must be the name of input I2 because the variable X can be
   * used only inside I2.
   * @type {string}
   */
  this.scopeInputName = scopeInputName;

  /**
   * The variable name for this value.
   * @type {string}
   */
  this.variableName_ = variableName;

  /**
   * A unique id for the variable.
   * @type {string}
   * @private
   */
  this.id_ = Blockly.utils.genUid();

  /**
   * A list of references that refer to this value.
   * @type {!Array.<Blockly.BoundVariableValueReference>}
   * @private
   */
  this.referenceList_ = [];

  /**
   * Whether this variable value is scheduled to be deleted. If true, will be
   * deleted when there is no references to this value.
   * @type {boolean}
   * @private
   */
  this.deleteLater_ = false;

  this.sourceBlock_.typedValue[this.fieldName] = this;
  Blockly.BoundVariables.addValue(this.workspace_, this);

  // TODO: Register an event for the variable creation.
  // Blockly.Events.fire(new Blockly.Events.VarCreate(this));
};

/**
 * Get the source block for this varialbe.
 * @return {!Blockly.Block} The source block
 */
Blockly.BoundVariableValue.prototype.getSourceBlock = function() {
  return this.sourceBlock_;
};

/**
 * Get the workspace of this variable's source block.
 * @return {!Blockly.Workspace} The source block's workspace, or null.
 */
Blockly.BoundVariableValue.prototype.getWorkspace = function() {
  return this.workspace_;
};

/**
 * Get the variable name for this variable.
 * @return {!string} This variable's name.
 */
Blockly.BoundVariableValue.prototype.getVariableName = function() {
  return this.variableName_;
};

/**
 * Set the variable name for this variable.
 * @param {!string} newName The new name for this variable.
 */
Blockly.BoundVariableValue.prototype.setVariableName = function(newName) {
  if (this.variableName_ !== newName) {
    this.variableName_ = newName;
    for (var i = 0, reference; reference = this.referenceList_[i]; i++) {
      reference.setVariableName(newName);
    }
    // Rerender the block.
    this.sourceBlock_.getField(this.fieldName).updateText();
  }
};

/**
 * @return {!string} The ID for the variable.
 */
Blockly.BoundVariableValue.prototype.getId = function() {
  return this.id_;
};

/**
 * Dispose of this value.
 */
Blockly.BoundVariableValue.prototype.dispose = function() {
  if (this.referenceList_.length == 0) {
    Blockly.BoundVariables.removeValue(this.workspace_, this);
    this.workspace_ = null;
    delete this.sourceBlock_.typedValue[this.fieldName];
    this.sourceBlock_ = null;
    this.typeExpr = null;
  } else {
    // Currently can not be destroyed because this variable value has
    // references. Delete this when the number of references drops to zero.
    this.deleteLater_ = true;
  }
};

/**
 * Store the reference to a list of references.
 * @param {!Blockly.BoundVariableValueReference} reference The reference to
 *     store a list of references.
 */
Blockly.BoundVariableValue.prototype.storeReference = function(reference) {
  if (this.referenceList_.indexOf(reference) != -1) {
    throw 'Duplicated references.';
  }
  if (this.deleteLater_) {
    throw 'Can not add a reference any more, this value is being deleted.';
  }
  this.referenceList_.push(reference);
};

/**
 * Remove the reference from a list of references.
 * @param {!Blockly.BoundVariableValueReference} reference The reference to
 *     remove from a list of references.
 */
Blockly.BoundVariableValue.prototype.removeReference = function(reference) {
  var removalIndex = this.referenceList_.indexOf(reference);
  if (removalIndex == -1) {
    throw 'Unable to find the reference.';
  }
  this.referenceList_.splice(removalIndex, 1);

  // Delete this value if it's scheduled to do so and there is no references.
  if (this.deleteLater_ && !this.referenceList_.length) {
    this.dispose();
  }
};