<?php
/**
 * Plugin Name:       DMG Challenge
 * Description:       DMG Security interactive blocks
 * Version:           2.1
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            Sergio Oliver
 * Author URI:        https://sergiooliver.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       dmg
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}


if ( ! defined( 'DMG_CHALLENGE_PATH' ) ) {
	define( 'DMG_CHALLENGE_PATH', plugin_dir_path( __FILE__ ) );
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function register_dmg_blocks_block_init() {
	register_block_type( DMG_CHALLENGE_PATH . '/build/post-search' );
}
add_action( 'init', 'register_dmg_blocks_block_init' );



/**
 * WP-CLI command: dmg-read-more search
 *
 * Usage:
 *   wp dmg-read-more search --date-before=2025-10-01 --date-after=2025-09-01
 *
 * If omitted, defaults to last 30 days.
 */

if ( defined( 'WP_CLI' ) && WP_CLI ) {

	require DMG_CHALLENGE_PATH . 'DmgCLI.php';
	
	WP_CLI::add_command( 'dmg-read-more', 'DmgCLI' );
}
