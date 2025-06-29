import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CustomButton - 自定义按钮
 * 
 * @created function(text, render) {
          return new Date().toLocaleString(&#39;zh-CN&#39;);
        }
 */
@Component({
  selector: 'custom-button',
  standalone: true,
  imports: [CommonModule, ],
  templateUrl: './custom-button.component.html',
  styleUrls: ['./custom-button.component.css']
})
export class CustomButtonComponent {
  /**
   * 自定义按钮
   */
  @Input() text: string = 'CustomButton';
  @Input() type: string = 'primary';
  @Input() size: string = 'medium';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon: string = '';
  @Input() iconPosition: string = 'left';
  @Input() iconSize: string = '16';


  constructor() {
    console.log('CustomButtonComponent constructed');
  }

  // TODO: 添加其他方法
  onClick() {
    console.log('CustomButtonComponent clicked');
  }
} 