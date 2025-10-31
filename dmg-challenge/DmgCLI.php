<?php
class DmgCLI {
/**
 * Search for posts with the dgm challenge block
 */

    public function search( $args, $assoc_args ) {
        global $wpdb;

        // default 30 days
        if ( isset( $assoc_args['date-before'] ) ) {
            $date_before = sanitize_text_field( $assoc_args['date-before'] );
        } else {
            $date_before = current_time( 'Y-m-d' );
        }

        if ( isset( $assoc_args['date-after'] ) ) {
            $date_after = sanitize_text_field( $assoc_args['date-after'] );
        } else {
            $date_after = date( 'Y-m-d', strtotime( '-30 days', strtotime( current_time( 'Y-m-d' ) ) ) );
        }

        WP_CLI::log("Searching between $date_after and $date_before...");

        $limit = 500; // fetch 500 rows at a time
        $offset = 0;
        $total_found = 0;

        do {
            $sql = $wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts}
                 WHERE post_type = 'post'
                 AND post_status = 'publish'
                 AND post_date >= %s
                 AND post_date <= %s
                 AND post_content LIKE %s
                 LIMIT %d OFFSET %d",
                $date_after . ' 00:00:00',
                $date_before . ' 23:59:59',
                '%<!-- wp:dmg/post-search%',
                $limit,
                $offset
            );

            $results = $wpdb->get_results($sql);

            if(empty($results)) break;

            foreach($results as $r){
                WP_CLI::log($r->ID);
                $total_found++;
            }

            $offset += $limit;

        } while (count($results) === $limit);

        if($total_found === 0){
            WP_CLI::warning("Nothing found!");
        } else {
            WP_CLI::success("Found $total_found posts!");
        }
    }
}
