CREATE TABLE scores (
 player TEXT NOT NULL, track TEXT NOT NULL, difficulty TEXT NOT NULL, mode TEXT NOT NULL,
 score INTEGER NOT NULL, accuracy INTEGER NOT NULL, updated INTEGER NOT NULL,
 PRIMARY KEY (player, track, difficulty, mode)
);
--> statement-breakpoint
CREATE INDEX scores_board ON scores(track, difficulty, mode, score DESC, accuracy DESC, updated);
