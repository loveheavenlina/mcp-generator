import { Component, OnInit, OnDestroy, Input, Input, Output, EventEmitter, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UserProfile - 用户资料组件
 * 
 * @created function(text, render) {
          return new Date().toLocaleString(&#39;zh-CN&#39;);
        }
 */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  /**
   * 用户信息对象
   */
  @Input() user: User;
  /**
   * 是否可编辑
   */
  @Input() editable: boolean = false;

  /**
   * 用户信息更新事件
   */
  @Output() userUpdated = new EventEmitter<User>();
  /**
   * 编辑模式切换事件
   */
  @Output() editToggled = new EventEmitter<boolean>();

  constructor() {
    console.log('UserProfileComponent constructed');
  }

  ngOnInit(): void {
    console.log('UserProfileComponent initialized');
    // TODO: 初始化逻辑
  }

  ngOnDestroy(): void {
    console.log('UserProfileComponent destroyed');
    // TODO: 清理逻辑
  }


  /**
   * 触发userUpdated事件
   */
  onUserUpdated(data: User): void {
    this.userUpdated.emit(data);
  }
  /**
   * 触发editToggled事件
   */
  onEditToggled(data: boolean): void {
    this.editToggled.emit(data);
  }

  // TODO: 添加其他方法
} 