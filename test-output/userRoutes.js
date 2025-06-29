/**
 * user 路由
 * 用户管理路由
 * 
 * @created 2025&#x2F;6&#x2F;29 12:05:33
 */

const express = require('express');
const router = express.Router();


/**
 * 获取列表
 * GET &#x2F;api&#x2F;users&#x2F;
 */
router.('&#x2F;', async (req, res) => {
  try {
    const result = await userController.list(req, res);
    res.json({
      success: true,
      data: result,
      message: '获取列表成功'
    });
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取列表失败',
      error: error.message
    });
  }
});

/**
 * 创建新项
 * POST &#x2F;api&#x2F;users&#x2F;
 */
router.('&#x2F;', async (req, res) => {
  try {
    const result = await userController.create(req, res);
    res.json({
      success: true,
      data: result,
      message: '创建新项成功'
    });
  } catch (error) {
    console.error('创建新项失败:', error);
    res.status(500).json({
      success: false,
      message: '创建新项失败',
      error: error.message
    });
  }
});

/**
 * 根据ID获取项
 * GET &#x2F;api&#x2F;users&#x2F;:id
 */
router.('&#x2F;:id', async (req, res) => {
  try {
    const result = await userController.getById(req, res);
    res.json({
      success: true,
      data: result,
      message: '根据ID获取项成功'
    });
  } catch (error) {
    console.error('根据ID获取项失败:', error);
    res.status(500).json({
      success: false,
      message: '根据ID获取项失败',
      error: error.message
    });
  }
});

/**
 * 更新项
 * PUT &#x2F;api&#x2F;users&#x2F;:id
 */
router.('&#x2F;:id', async (req, res) => {
  try {
    const result = await userController.update(req, res);
    res.json({
      success: true,
      data: result,
      message: '更新项成功'
    });
  } catch (error) {
    console.error('更新项失败:', error);
    res.status(500).json({
      success: false,
      message: '更新项失败',
      error: error.message
    });
  }
});

/**
 * 删除项
 * DELETE &#x2F;api&#x2F;users&#x2F;:id
 */
router.('&#x2F;:id', async (req, res) => {
  try {
    const result = await userController.delete(req, res);
    res.json({
      success: true,
      data: result,
      message: '删除项成功'
    });
  } catch (error) {
    console.error('删除项失败:', error);
    res.status(500).json({
      success: false,
      message: '删除项失败',
      error: error.message
    });
  }
});



module.exports = router; 